import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import TravelAgentApplication from '@/models/TravelAgentApplication';
import { getSession } from '@/lib/get-session';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    
    const formData = await req.formData();
    
    // Extract form fields
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const companyName = formData.get('companyName') as string;
    const companyType = formData.get('companyType') as string;
    const licenseNumber = formData.get('licenseNumber') as string;
    const gstNumber = formData.get('gstNumber') as string;
    const panNumber = formData.get('panNumber') as string;
    
    // Parse nested objects from JSON strings
    const address = JSON.parse(formData.get('address') as string || '{}');
    const businessDetails = JSON.parse(formData.get('businessDetails') as string || '{}');
    const commissionExpectations = JSON.parse(formData.get('commissionExpectations') as string || '{}');
    
    // Determine company type for conditional validation
    const isBusinessEntity = ['agency', 'corporate', 'tour_operator'].includes(companyType);
    
    // Handle file uploads
    const uploadedDocuments: any = {};
    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    
    // Document requirements based on company type
    const requiredDocuments = isBusinessEntity 
      ? [] // No strictly required documents
      : []; // No required documents for individuals
    
    // Handle profile pictures first
    const pictureFields = ['profilePicture', 'companyLogo'];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    
    for (const field of pictureFields) {
      const file = formData.get(field) as File;
      if (file && file.size > 0) {
        // Validate image type
        if (!allowedImageTypes.includes(file.type)) {
          return NextResponse.json(
            { success: false, message: `Invalid image type for ${field}. Only JPEG, PNG files are allowed.` },
            { status: 400 }
          );
        }
        
        // Validate file size
        if (file.size > maxFileSize) {
          return NextResponse.json(
            { success: false, message: `Image ${field} is too large. Maximum size is 5MB.` },
            { status: 400 }
          );
        }
        
        // Generate unique filename
        const fileExtension = path.extname(file.name);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        const uploadDir = field === 'profilePicture' ? 'profiles' : 'logos';
        const uploadPath = path.join(process.cwd(), 'public', 'uploads', uploadDir, uniqueFilename);
        
        // Create directory if it doesn't exist
        const fs = require('fs');
        const uploadDirPath = path.join(process.cwd(), 'public', 'uploads', uploadDir);
        if (!fs.existsSync(uploadDirPath)) {
          fs.mkdirSync(uploadDirPath, { recursive: true });
        }
        
        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(uploadPath, buffer);
        
        uploadedDocuments[field] = `/uploads/${uploadDir}/${uniqueFilename}`;
      }
    }
    
    const optionalDocuments = ['license', 'gstCertificate', 'panCard', 'addressProof', 'businessRegistration', 'bankStatement'];
    const documentFields = optionalDocuments;
    
    for (const field of documentFields) {
      const file = formData.get(field) as File;
      if (file && file.size > 0) {
        // Validate file type
        if (!allowedFileTypes.includes(file.type)) {
          return NextResponse.json(
            { success: false, message: `Invalid file type for ${field}. Only PDF, JPEG, PNG files are allowed.` },
            { status: 400 }
          );
        }
        
        // Validate file size
        if (file.size > maxFileSize) {
          return NextResponse.json(
            { success: false, message: `File ${field} is too large. Maximum size is 5MB.` },
            { status: 400 }
          );
        }
        
        // Generate unique filename
        const fileExtension = path.extname(file.name);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'documents', uniqueFilename);
        
        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(uploadPath, buffer);
        
        uploadedDocuments[field] = `/uploads/documents/${uniqueFilename}`;
      }
    }

    // Enhanced validation
    if (!name || !email || !phone || !password || !companyName || !companyType || !address?.street || !address?.city) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Phone validation
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format' },
        { status: 400 }
      );
    }
    
    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // For business entities, encourage but don't require business credentials
    if (isBusinessEntity && !licenseNumber && !gstNumber && !panNumber) {
      console.log('Business entity registered without business credentials - may need manual review');
    }
    
    // Validate PAN if provided
    if (panNumber && panNumber.trim()) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panNumber.toUpperCase())) {
        return NextResponse.json(
          { success: false, message: 'Invalid PAN number format' },
          { status: 400 }
        );
      }
    }
    
    // Validate GST if provided
    if (gstNumber && gstNumber.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber.toUpperCase())) {
        return NextResponse.json(
          { success: false, message: 'Invalid GST number format' },
          { status: 400 }
        );
      }
    }
    
    // Validate license number format if provided
    if (licenseNumber && licenseNumber.trim()) {
      if (licenseNumber.length < 5) {
        return NextResponse.json(
          { success: false, message: 'License number must be at least 5 characters' },
          { status: 400 }
        );
      }
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if application already exists for this email
    const existingApplication = await TravelAgentApplication.findOne({ email });
    if (existingApplication) {
      return NextResponse.json(
        { success: false, message: 'An application with this email already exists' },
        { status: 400 }
      );
    }

    // Create new application
    const application = new TravelAgentApplication({
      name,
      email,
      phone,
      password: hashedPassword,
      companyName,
      companyType,
      licenseNumber,
      gstNumber: gstNumber?.toUpperCase(),
      panNumber: panNumber?.toUpperCase(),
      address,
      businessDetails,
      commissionExpectations,
      profilePicture: uploadedDocuments.profilePicture,
      companyLogo: uploadedDocuments.companyLogo,
      documents: {
        license: uploadedDocuments.license,
        gstCertificate: uploadedDocuments.gstCertificate,
        panCard: uploadedDocuments.panCard,
        addressProof: uploadedDocuments.addressProof,
        businessRegistration: uploadedDocuments.businessRegistration,
        bankStatement: uploadedDocuments.bankStatement
      }
    });

    await application.save();

    return NextResponse.json({
      success: true,
      message: 'Travel agent application submitted successfully',
      applicationId: application._id
    });

  } catch (error: any) {
    console.error('Travel agent registration error:', error);
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'An application with this email already exists' },
        { status: 409 }
      );
    }
    
    // Handle file system errors
    if (error.code === 'ENOENT' || error.code === 'EACCES') {
      return NextResponse.json(
        { success: false, message: 'File upload failed. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Failed to submit application. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const application = await TravelAgentApplication.findOne({ email });
    
    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application: {
        id: application._id,
        status: application.status,
        statusDisplay: application.statusDisplay,
        createdAt: application.createdAt,
        adminNotes: application.adminNotes,
        rejectionReason: application.rejectionReason
      }
    });

  } catch (error: any) {
    console.error('Travel agent application check error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check application status' },
      { status: 500 }
    );
  }
} 