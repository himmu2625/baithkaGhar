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
 * Upload an image to Cloudinary
 * @param file - Image file as Buffer or base64 string
 * @param options - Upload options
 * @returns Upload result
 */
export async function uploadImage(
  file: Buffer | string,
  options: {
    folder?: string;
    publicId?: string;
    tags?: string[];
    transformation?: any[];
    resourceType?: string;
  } = {}
) {
  try {
    const folder = options.folder || DEFAULT_FOLDER;
    
    const uploadOptions: any = {
      folder,
      resource_type: options.resourceType || 'image',
    };
    
    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }
    
    if (options.tags && options.tags.length > 0) {
      uploadOptions.tags = options.tags;
    }
    
    if (options.transformation) {
      uploadOptions.transformation = options.transformation;
    }
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadCallback = (error: any, result: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };
      
      if (typeof file === 'string' && file.startsWith('data:')) {
        // Upload base64 data URL
        cloudinary.uploader.upload(file, uploadOptions, uploadCallback);
      } else if (Buffer.isBuffer(file)) {
        // Upload buffer
        cloudinary.uploader.upload_stream(uploadOptions, uploadCallback).end(file);
      } else {
        reject(new Error('Invalid file format. Expected Buffer or base64 string.'));
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - Public ID of the image
 * @returns Deletion result
 */
export async function deleteImage(publicId: string) {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
}

/**
 * Generate a signed upload URL for client-side uploads
 * @param options - Options for the signed URL
 * @returns Signed upload parameters
 */
export function generateUploadSignature(
  options: {
    folder?: string;
    transformation?: any[];
    maxFileSize?: number;
    resourceType?: string;
    tags?: string[];
  } = {}
) {
  const folder = options.folder || DEFAULT_FOLDER;
  const timestamp = Math.round(new Date().getTime() / 1000);
  const maxFileSize = options.maxFileSize || 5 * 1024 * 1024; // Default 5MB
  
  // Create the signature parameters
  const params: any = {
    timestamp,
    folder,
    resource_type: options.resourceType || 'image',
    max_file_size: maxFileSize,
  };
  
  if (options.transformation) {
    params.transformation = JSON.stringify(options.transformation);
  }
  
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
    resourceType: params.resource_type,
    maxFileSize,
  };
}

// Export the configured cloudinary instance
export { cloudinary }; 