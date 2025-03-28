import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }).end(file.buffer); 
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    // Determine resource type based on mimetype
    const resourceType: CloudinaryResourceType = this.getResourceType(file.mimetype);
    
    // Extract filename without extension and the extension itself
    const originalName = file.originalname;
    const lastDotIndex = originalName.lastIndexOf('.');
    const fileNameWithoutExt = lastDotIndex !== -1 ? 
      originalName.substring(0, lastDotIndex) : originalName;
    const fileExt = lastDotIndex !== -1 ? 
      originalName.substring(lastDotIndex) : '';
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ 
        resource_type: resourceType,
        // Add folder for better organization
        folder: 'chat-attachments',
        // Preserve original filename with extension for easier user recognition
        public_id: fileNameWithoutExt,
        // Use original format to preserve file extension
        use_filename: true,
        unique_filename: true,
        // Flag as attachment for proper download handling
        attachment: true,
        // Add context for more info
        context: {
          original_filename: originalName,
          mime_type: file.mimetype
        }
      }, (error, result) => {
        if (error) return reject(error);
        
        // For non-image files, ensure the URL includes the resource_type for proper handling
        if (resourceType !== 'image' && result) {
          // Extract the base URL without the /image/ path segment
          const urlParts = result.secure_url.split('/');
          const uploadIndex = urlParts.findIndex(part => part === 'upload');
          
          if (uploadIndex !== -1) {
            // Reconstruct URL with proper resource_type
            urlParts.splice(uploadIndex, 0, resourceType);
            result.secure_url = urlParts.join('/');
            
            // Ensure the URL includes the file extension for proper MIME type handling
            if (!result.secure_url.endsWith(fileExt) && fileExt) {
              result.secure_url = `${result.secure_url}${fileExt}`;
            }
          }
        }
        
        resolve(result);
      }).end(file.buffer);
    });
  }

  private getResourceType(mimetype: string): CloudinaryResourceType {
    if (mimetype.startsWith('image/')) {
      return 'image';
    } else if (mimetype.startsWith('video/')) {
      return 'video';
    } else {
      // For documents, PDFs, text files, etc.
      return 'raw';
    }
  }
}
