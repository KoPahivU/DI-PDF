import { PdfFile } from './../pdf-files/schemas/pdf-file.schema';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateRecentDocumentDto } from './dto/update-recent-document.dto';
import { User } from '../user/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, ObjectId, Types } from 'mongoose';
import { RecentDocument } from './schemas/recent-document.schema';
import { PdfFilesService } from '../pdf-files/pdf-files.service';
import { PaginationDto2 } from '@/common/dto/pagination2.dto';

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

  async create(fileId: string, userId: Types.ObjectId) {
    const fiLeIdObject = new mongoose.Types.ObjectId(fileId);
    const recentDoc = await this.recentDocumentModel.findOne({
      fileId: fileId,
      userId,
    });
    console.log(recentDoc);

    try {
      await this.pdfService.getPdf(fiLeIdObject, userId, null);
    } catch {
      throw new BadRequestException('You have no permission');
    }

    const newDate = new Date();
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

  parseCustomDate(str: string): Date {
    const [timePart, datePart] = str.split(' ');
    const [hh, mm, ss] = timePart.split(':').map(Number);
    const [dd, MM, yyyy] = datePart.split('/').map(Number);
    return new Date(yyyy, MM - 1, dd, hh, mm, ss);
  }

  async findAll(paginationDto: PaginationDto2, userId: Types.ObjectId | string) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found.');

    const allDocs = await this.recentDocumentModel.find({ userId });

    const sortedDocs = [...allDocs].sort((a, b) => {
      const dateA = this.parseCustomDate(a.date);
      const dateB = this.parseCustomDate(b.date);
      return paginationDto.isDesc === 'true' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

    const paginatedDocs = sortedDocs.slice(skip, skip + limit);

    const dataPromises = paginatedDocs.map(async (recentDoc) => {
      const pdfFile = await this.pdfFileModel.findById(recentDoc.fileId);
      const user = await this.userModel.findById(pdfFile?.ownerId);
      return {
        recent: recentDoc,
        pdf: pdfFile,
        user,
      };
    });

    const returnData = await Promise.all(dataPromises);
    const total = allDocs.length;

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
