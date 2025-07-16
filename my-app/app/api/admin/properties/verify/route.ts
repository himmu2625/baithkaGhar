import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

// API endpoint to handle property verification requests
export async function POST(req: NextRequest) {
  try {
    // Get the session using the auth helper
    const session = await auth();
    
    // Check admin authorization
    const userRole = session?.user?.role as string | undefined;
    
    if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { propertyId, status, notes } = body;
    
    if (!propertyId || !status) {
      return NextResponse.json(
        { success: false, message: "Property ID and status are required" },
        { status: 400 }
      );
    }
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectMongo();
    
    // Find the property
    const property = await Property.findById(propertyId);
    
    if (!property) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }
    
    // Update property verification status
    property.verificationStatus = status;
    property.verificationNotes = notes || '';
    property.verifiedAt = status === 'approved' ? new Date() : undefined;
    property.verifiedBy = status === 'approved' ? session!.user.id : undefined;
    
    // If approved, make sure the property is published
    if (status === 'approved') {
      property.isPublished = true;
    }
    
    await property.save();
    
    // Get property owner information for notification
    const propertyOwner = await User.findById(property.userId);
    
    // Send email notification to property owner if email service is configured
    if (propertyOwner && propertyOwner.email) {
      try {
        let emailSubject, emailContent;
        
        if (status === 'approved') {
          emailSubject = "Your Property Listing Has Been Approved";
          emailContent = `
            <h1>Congratulations! Your property has been approved</h1>
            <p>Your property "${property.title}" has been reviewed and approved by our team.</p>
            <p>It is now visible to potential guests on our platform.</p>
            ${notes ? `<p><strong>Admin notes:</strong> ${notes}</p>` : ''}
            <p>Thank you for listing your property with Baithaka Ghar!</p>
          `;
        } else if (status === 'rejected') {
          emailSubject = "Your Property Listing Requires Updates";
          emailContent = `
            <h1>Property Review Update</h1>
            <p>Your property "${property.title}" has been reviewed by our team.</p>
            <p>We need you to make some changes before we can approve your listing:</p>
            ${notes ? `<p><strong>Admin feedback:</strong> ${notes}</p>` : 
              '<p><strong>Please contact support for more details.</strong></p>'}
            <p>Please update your listing and resubmit for verification.</p>
          `;
        } else {
          emailSubject = "Your Property Listing Status Update";
          emailContent = `
            <h1>Property Status Update</h1>
            <p>Your property "${property.title}" status has been updated to: Pending</p>
            <p>Our team will review your listing soon.</p>
          `;
        }
        
        await sendEmail({
          to: propertyOwner.email,
          subject: emailSubject,
          html: emailContent
        });
      } catch (emailError) {
        console.error("Failed to send property verification email:", emailError);
        // Continue despite email failure - don't block the verification process
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Property ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'set to pending'}`,
      property: {
        _id: property._id,
        title: property.title,
        verificationStatus: property.verificationStatus,
        isPublished: property.isPublished
      }
    });
    
  } catch (error: any) {
    console.error("Error verifying property:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process verification" },
      { status: 500 }
    );
  }
}

// Get pending verification requests
export async function GET(req: NextRequest) {
  try {
    // Get the session using the auth helper
    const session = await auth();
    
    // Check admin authorization
    const userRole = session?.user?.role as string | undefined;
    
    if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectMongo();
    
    // Get filter from query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    
    // Build query
    const query: any = { verificationStatus: status };
    
    // Find properties needing verification
    const properties = await Property.find(query)
      .populate('userId', 'name email') // Get owner info
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      properties,
      count: properties.length
    });
    
  } catch (error: any) {
    console.error("Error getting verification requests:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get verification requests" },
      { status: 500 }
    );
  }
} 