import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/db/dbConnect"
import mongoose, { Document, Model } from 'mongoose'
import User from "@/models/User"
import AdminRequest from "@/models/AdminRequest"
import { sendReactEmail } from "@/lib/services/email"

// Define TypeScript interfaces
interface IAdmin extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  phone?: string;
  organization: string;
  position: string;
  department?: string;
  roleType: 'super_admin' | 'admin' | 'editor' | 'support';
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IAdminInfo {
  fullName: string;
  email: string;
  passwordHash: string;
  phone?: string;
  organization: string;
  position: string;
  department?: string;
  roleType: 'super_admin' | 'admin' | 'editor' | 'support';
}

interface IAdminRegistrationRequest extends Document {
  adminInfo: IAdminInfo;
  accessReason: string;
  referenceCode?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

// Define admin models dynamically
function getAdminModel(): Model<IAdmin> {
  const AdminSchema = new mongoose.Schema({
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    phone: String,
    organization: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    department: String,
    roleType: {
      type: String,
      required: true,
      enum: ['super_admin', 'admin', 'editor', 'support'],
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'approved', 'rejected'],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    lastLogin: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    }
  });

  // Check if model already exists to prevent model overwrite error
  return mongoose.models.Admin as Model<IAdmin> || 
    mongoose.model<IAdmin>('Admin', AdminSchema);
}

// Define admin registration request model dynamically
function getAdminRegistrationRequestModel(): Model<IAdminRegistrationRequest> {
  const AdminRegistrationRequestSchema = new mongoose.Schema({
    adminInfo: {
      fullName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
      },
      passwordHash: {
        type: String,
        required: true,
      },
      phone: String,
      organization: {
        type: String,
        required: true,
      },
      position: {
        type: String,
        required: true,
      },
      department: String,
      roleType: {
        type: String, 
        required: true,
        enum: ['super_admin', 'admin', 'editor', 'support'],
      },
    },
    accessReason: {
      type: String,
      required: true,
    },
    referenceCode: String,
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'approved', 'rejected'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
  });

  // Check if model already exists to prevent model overwrite error
  return mongoose.models.AdminRegistrationRequest as Model<IAdminRegistrationRequest> || 
    mongoose.model<IAdminRegistrationRequest>('AdminRegistrationRequest', AdminRegistrationRequestSchema);
}

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect()
    
    // Parse request body
    const body = await req.json()
    const { 
      fullName, 
      email, 
      password, 
      confirmPassword, 
      phone, 
      organization, 
      position, 
      department, 
      roleType, 
      accessReason, 
      referenceCode 
    } = body
    
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'password', 'confirmPassword', 'organization', 'position', 'roleType', 'accessReason']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, message: `${field} is required` }, { status: 400 })
      }
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, message: 'Passwords do not match' }, { status: 400 })
    }
    
    // Get models
    const Admin = getAdminModel()
    const AdminRegistrationRequest = getAdminRegistrationRequestModel()
    
    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      )
    }

    // Check if a pending request already exists
    const existingRequest = await AdminRequest.findOne({ email, status: "pending" })
    if (existingRequest) {
      return NextResponse.json(
        { message: "You already have a pending request" },
        { status: 400 }
      )
    }

    // Check if email already registered
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() })
    if (existingAdmin) {
      return NextResponse.json(
        { message: "Email is already registered" },
        { status: 400 }
      )
    }

    // Check for pending registration request
    const pendingRequest = await AdminRegistrationRequest.findOne({ 
      'adminInfo.email': email.toLowerCase(), 
      status: 'pending' 
    })
    
    if (pendingRequest) {
      return NextResponse.json(
        { message: "You already have a pending registration request" },
        { status: 400 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create registration request
    const registrationRequest = new AdminRegistrationRequest({
      adminInfo: {
        fullName,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone || '',
        organization,
        position,
        department: department || '',
        roleType,
      },
      accessReason,
      referenceCode: referenceCode || '',
    })
    
    await registrationRequest.save()

    // Send notification email to admin
    await sendReactEmail({
      to: email,
      subject: "Registration Request Received",
      emailComponent: {
        name: fullName,
        otp: 'Registration Request Received',
      }
    })
    
    // Notify super admins
    const superAdmins = await Admin.find({ roleType: 'super_admin', status: 'approved' })
    
    for (const admin of superAdmins) {
      await sendReactEmail({
        to: admin.email,
        subject: "New Admin Registration Request",
        emailComponent: {
          name: admin.fullName,
          requestFrom: fullName,
        }
      })
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Registration request submitted successfully", 
        requestId: registrationRequest._id 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Admin registration error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to process registration request" },
      { status: 500 }
    )
  }
} 