import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { public_id } = body;

    if (!public_id) {
      return NextResponse.json({ success: false, message: 'Public ID is required' }, { status: 400 });
    }

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === 'ok') {
      return NextResponse.json({ success: true, message: 'Image deleted successfully' });
    } else {
      return NextResponse.json({ success: false, message: 'Failed to delete image' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
} 