import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadImage } from '@/lib/services/cloudinary';
import { cityService } from '@/services/cityService';

export const dynamic = 'force-dynamic';

// POST /api/cities/upload-image - Upload city image to Cloudinary
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (session?.user?.role !== 'admin' && session?.user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const cityId = formData.get('cityId') as string;
    const cityName = formData.get('cityName') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!cityId) {
      return NextResponse.json(
        { error: 'City ID is required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert buffer to base64 data URL
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`Uploading image for city: ${cityName} (${cityId})`);

    // Upload to Cloudinary WITHOUT transformations
    // Store the original high-quality image
    // Transformations will be applied dynamically when displaying the image
    const uploadResult: any = await uploadImage(dataUrl, {
      folder: 'baithaka/cities',
      publicId: `city_${cityName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      tags: ['city', cityName],
      // No transformation during upload - keep original quality
    });

    console.log('Cloudinary upload result:', uploadResult.secure_url);

    // Update city with new image URL
    const updatedCity = await cityService.updateCity(cityId, {
      image: uploadResult.secure_url,
    });

    if (!updatedCity) {
      return NextResponse.json(
        { error: 'Failed to update city with new image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: uploadResult.secure_url,
      city: updatedCity,
      cloudinaryData: {
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    });
  } catch (error: any) {
    console.error('Error uploading city image:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}
