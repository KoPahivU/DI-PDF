import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImageFromUrl(imageUrl: string): Promise<UploadApiResponse> {
    return cloudinary.uploader.upload(imageUrl, {
      folder: 'avatars',
      transformation: [{ width: 200, height: 200, crop: 'thumb', gravity: 'face' }],
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'avatars' }, (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Upload failed'));
          }
          resolve(result);
        })
        .end(file.buffer);
    });
  }

  async uploadPdf(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(file.path, { resource_type: 'raw', access_mode: 'public' }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as UploadApiResponse);
        }
      });
    });
  }
}
