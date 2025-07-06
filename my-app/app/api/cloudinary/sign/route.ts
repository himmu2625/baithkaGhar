import { NextResponse } from 'next/server';
import { adminApiAuth } from '@/lib/admin-auth';
import { generateUploadSignature } from '@/lib/services/cloudinary';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const authResult = await adminApiAuth(req);
        if (authResult instanceof NextResponse) {
            return authResult; // Return the unauthorized response
        }

        const body = await req.json();
        const { folder = 'special_offers', tags = [] } = body;
        
        const signatureData = generateUploadSignature({
            folder,
            tags,
        });

        return NextResponse.json(signatureData);

    } catch (error) {
        console.error('Error generating Cloudinary signature:', error);
        return NextResponse.json(
            { success: false, message: 'An error occurred while generating the upload signature.' },
            { status: 500 }
        );
    }
} 