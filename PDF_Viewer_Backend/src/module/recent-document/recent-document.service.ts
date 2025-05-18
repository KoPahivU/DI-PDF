import { PdfFile } from './../pdf-files/schemas/pdf-file.schema';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRecentDocumentDto } from './dto/create-recent-document.dto';
import { UpdateRecentDocumentDto } from './dto/update-recent-document.dto';
import { User } from '../user/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
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

  async create(createRecentDocumentDto: CreateRecentDocumentDto) {
    const recentDoc = await this.recentDocumentModel.findOne({
      fileId: createRecentDocumentDto.fileId,
      userId: createRecentDocumentDto.userId,
    });

    try {
      await this.pdfService.getPdf(createRecentDocumentDto.fileId.toString(), createRecentDocumentDto.userId, null);
    } catch {
      throw new BadRequestException('You have no permission');
    }

    if (recentDoc) {
      recentDoc.date = new Date();
    } else {
      const newRecent = await this.recentDocumentModel.create({
        fileId: createRecentDocumentDto.fileId,
        userId: createRecentDocumentDto.userId,
        date: new Date(),
      });

      return newRecent;
    }
  }

  async findAll(paginationDto: PaginationDto, userId: Types.ObjectId | string) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const user = await this.userModel.findById(userId);

    if (!user) throw new BadRequestException('User not found.');

    const recentDocs = await this.recentDocumentModel.find({ userId }).skip(skip).limit(limit);

    const dataPromises = recentDocs.map(async (recentDoc) => {
      const pdfFile = await this.pdfFileModel.findById(recentDoc.fileId);
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
