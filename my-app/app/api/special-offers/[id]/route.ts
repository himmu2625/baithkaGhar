import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import SpecialOffer from '@/models/SpecialOffer';
import { adminApiAuth } from '@/lib/admin-auth';
import { deleteImage } from '@/lib/services/cloudinary';
import { NextRequest } from 'next/server';

interface Params {
    params: {
        id: string;
    }
}

// UPDATE a special offer (Admin only)
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const authResult = await adminApiAuth(req);
        if (authResult instanceof NextResponse) {
            return authResult; // Return the unauthorized response
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json({ success: false, message: 'Offer ID is required.' }, { status: 400 });
        }
        
        await dbConnect();
        
        const body = await req.json();
        const { ...updateData } = body;

        const updatedOffer = await SpecialOffer.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!updatedOffer) {
            return NextResponse.json({ success: false, message: 'Special offer not found.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedOffer });
    } catch (error: any) {
        console.error(`Error updating special offer ${params.id}:`, error);
        if (error.name === 'ValidationError') {
            return NextResponse.json({ success: false, message: error.message }, { status: 400 });
        }
        return NextResponse.json(
            { success: false, message: `An error occurred while updating the special offer.` },
            { status: 500 }
        );
    }
}

// DELETE a special offer (Admin only)
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const authResult = await adminApiAuth(req);
        if (authResult instanceof NextResponse) {
            return authResult; // Return the unauthorized response
        }
        
        const { id } = params;
        if (!id) {
            return NextResponse.json({ success: false, message: 'Offer ID is required.' }, { status: 400 });
        }

        await dbConnect();

        const offerToDelete = await SpecialOffer.findById(id);

        if (!offerToDelete) {
            return NextResponse.json({ success: false, message: 'Special offer not found.' }, { status: 404 });
        }

        // Delete image from Cloudinary
        if (offerToDelete.publicId) {
            await deleteImage(offerToDelete.publicId);
        }

        await SpecialOffer.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: 'Special offer deleted successfully.' });
    } catch (error) {
        console.error(`Error deleting special offer ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: `An error occurred while deleting the special offer.` },
            { status: 500 }
        );
    }
} 