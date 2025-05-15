import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePdfFileDto } from './dto/create-pdf-file.dto';
import { UpdatePdfFileDto } from './dto/update-pdf-file.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PdfFile } from './schemas/pdf-file.schema';
import { Model, ObjectId } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class PdfFilesService {
  constructor(
    @InjectModel(PdfFile.name)
    private pdfFileModel: Model<PdfFile>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async uploadPdf(file: Express.Multer.File, userId: any, fileSizeDto: CreatePdfFileDto) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new BadRequestException('User not found!');

    const newTotal = (Number(user.usedStorage) ?? 0) + Number(fileSizeDto.fileSize);
    if (newTotal > 1000000000) throw new BadRequestException('Out of memory!');

    await this.userModel.updateOne({ _id: userId }, { $set: { usedStorage: newTotal } });

    const cloudinaryResult: UploadApiResponse = await this.cloudinaryService.uploadPdf(file);

    const newPdfFile = await this.pdfFileModel.create({
      fileName: file.originalname,
      fileSize: fileSizeDto.fileSize,
      storagePath: cloudinaryResult.secure_url,
      ownerId: userId,
      thumbnailUrl: '',
    });

    return {
      newPdfFile,
    };
  }

  async getPdf(fileId: string) {
    console.log('fileId: ', fileId);
    const file = await this.pdfFileModel.findById(fileId);

    if (!file) throw new BadRequestException('File id not found');

    return {
      storagePath: file.storagePath,
    };
  }

  create(createPdfFileDto: CreatePdfFileDto) {
    return 'This action adds a new pdfFile';
  }

  findAll() {
    return `This action returns all pdfFiles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pdfFile`;
  }

  update(id: number, updatePdfFileDto: UpdatePdfFileDto) {
    return `This action updates a #${id} pdfFile`;
  }

  remove(id: number) {
    return `This action removes a #${id} pdfFile`;
  }
}
