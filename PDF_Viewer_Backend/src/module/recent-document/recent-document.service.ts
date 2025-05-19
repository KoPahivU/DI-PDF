import { PdfFile } from './../pdf-files/schemas/pdf-file.schema';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRecentDocumentDto } from './dto/create-recent-document.dto';
import { UpdateRecentDocumentDto } from './dto/update-recent-document.dto';
import { User } from '../user/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, ObjectId, Types } from 'mongoose';
import { RecentDocument } from './schemas/recent-document.schema';
import { PdfFilesService } from '../pdf-files/pdf-files.service';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class RecentDocumentService {
  constructor(
    @InjectModel(RecentDocument.name)
    private readonly recentDocumentModel: Model<RecentDocument>,
    @InjectModel(PdfFile.name)
    private pdfFileModel: Model<PdfFile>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly pdfService: PdfFilesService,
  ) {}

  async create(fileId: Types.ObjectId | string, userId: Types.ObjectId) {
    const fiLeIdObject = new mongoose.Types.ObjectId(fileId);
    const recentDoc = await this.recentDocumentModel.findOne({
      fileId: fiLeIdObject,
      userId,
    });

    try {
      await this.pdfService.getPdf(fiLeIdObject, userId, null);
    } catch {
      throw new BadRequestException('You have no permission');
    }
    const newDate = new Date();
    console.log('newDate ISO:', newDate.toISOString());
    console.log('newDate Local:', newDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
    if (recentDoc) {
      recentDoc.date = newDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      await recentDoc.save();
      return recentDoc;
    } else {
      const newRecent = await this.recentDocumentModel.create({
        fileId,
        userId,
        date: newDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      });

      return newRecent;
    }
  }

  async findAll(paginationDto: PaginationDto, userId: Types.ObjectId | string) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const user = await this.userModel.findById(userId);

    if (!user) throw new BadRequestException('User not found.');

    const recentDocs = await this.recentDocumentModel.find({ userId }).skip(skip).limit(limit).sort({ date: -1 });

    const dataPromises = recentDocs.map(async (recentDoc) => {
      const pdfFile = await this.pdfFileModel.findById(recentDoc.fileId);
      const user = await this.userModel.findById(pdfFile?.ownerId);
      return {
        recent: recentDoc,
        pdf: pdfFile,
        user,
      };
    });

    const returnData = await Promise.all(dataPromises);

    const total = await this.recentDocumentModel.countDocuments({ userId });

    return {
      returnData,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} recentDocument`;
  }

  update(id: number, updateRecentDocumentDto: UpdateRecentDocumentDto) {
    return `This action updates a #${id} recentDocument`;
  }

  remove(id: number) {
    return `This action removes a #${id} recentDocument`;
  }
}
