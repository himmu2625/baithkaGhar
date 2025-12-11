'use server';

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Default folder for uploaded images
const DEFAULT_FOLDER = 'baithaka';

/**
 * Generate a signed upload URL for client-side uploads
 * @param options - Options for the signed URL
 * @returns Signed upload parameters
 */
export async function generateUploadSignature(
  options: {
    folder?: string;
    tags?: string[];
  } = {}
) {
  const folder = options.folder || DEFAULT_FOLDER;
  const timestamp = Math.round(new Date().getTime() / 1000);

  // Create the signature parameters
  const params: any = {
    timestamp,
    folder,
  };

  if (options.tags && options.tags.length > 0) {
    params.tags = options.tags.join(',');
  }

  // Generate the signature
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
}
