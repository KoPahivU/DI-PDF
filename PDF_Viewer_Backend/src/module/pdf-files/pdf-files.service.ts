import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePdfFileDto } from './dto/create-pdf-file.dto';
import { UpdatePdfFileDto } from './dto/update-pdf-file.dto';
import { InjectModel } from '@nestjs/mongoose';
import { AccessLevel, PdfFile, SharedLink, SharedUser } from './schemas/pdf-file.schema';
import { Model, ObjectId, Types } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';
import { AddUserPermissionDto } from './dto/add-user-permission.dto';
import { v4 as uuidv4 } from 'uuid';
import { AddLinkPermissionDto } from './dto/add-link-permission';

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

  async getPdf(fileId: string, userId: Types.ObjectId | string, shared: string) {
    const file = await this.pdfFileModel.findById(fileId);

    if (!file) throw new BadRequestException('File id not found');

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const sharedPermission = file.sharedLink.find((token) => token.token === shared);

    console.log(sharedPermission);

    if (userObjectId !== file.ownerId && !sharedPermission) throw new BadRequestException('You have no permission');

    if (shared) {
      const sharedItem = file.sharedLink.find((link) => link.token === shared);

      if (sharedItem) {
        const sharedUser = file.sharedWith.find((user) => user.userId === userObjectId);
        if (sharedUser) {
          sharedUser.access = sharedItem.access;
        } else {
          file.sharedWith.push({
            userId: userObjectId,
            access: sharedItem.access,
          });
        }

        file.markModified('sharedWith');
        await file.save();
      }
      return {
        file: file,
        access: sharedItem?.access,
      };
    }

    return {
      file: file,
      access: 'Owner',
    };
  }

  async addUserPermission(userId: string | Types.ObjectId, userPermission: AddUserPermissionDto) {
    const file = await this.pdfFileModel.findById(userPermission.fileId);

    if (!file) throw new BadRequestException('File id not found');

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const targetUserObjectId =
      typeof userPermission.userId === 'string' ? new Types.ObjectId(userPermission.userId) : userPermission.userId;

    if (!file) throw new BadRequestException('File id not found');

    const isOwner = file.ownerId === userId;
    const permission = file.sharedWith.find((sharedUser) => sharedUser.userId.equals(userObjectId));
    if (!isOwner && permission?.access !== 'Edit') throw new BadRequestException('You have no permission');

    const sharedUser = file.sharedWith.find((user) => user.userId.equals(targetUserObjectId));
    if (sharedUser) {
      sharedUser.access = userPermission.access;
    } else {
      const newData = {
        userId: targetUserObjectId,
        access: userPermission.access,
      };
      file.sharedWith.push(newData as SharedUser);
    }

    file.markModified('sharedWith');
    await file.save();
  }

  async addLinkPermission(userId: string | Types.ObjectId, addLinkPermission: AddLinkPermissionDto) {
    const file = await this.pdfFileModel.findById(addLinkPermission.fileId);

    if (!file) throw new BadRequestException('File id not found');

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const isOwner = userId === file.ownerId;
    const permission = file.sharedWith.find((sharedUser) => sharedUser.userId.equals(userObjectId));
    if (!isOwner && permission?.access !== 'Edit') throw new BadRequestException('You have no permission');

    const existedLink = file.sharedLink.find((link) => link.access === addLinkPermission.access);
    if (existedLink) {
      return existedLink;
    } else {
      let token: string;
      const existingTokens = new Set(file.sharedLink.map((link) => link.token));

      do {
        token = uuidv4();
      } while (existingTokens.has(token));

      const newData = { token, access: addLinkPermission.access };

      file.sharedLink.push(newData);
      file.markModified('sharedLink');
      await file.save();

      return newData;
    }
  }

  async removeUserPermission(
    removedUser: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    fileId: string | Types.ObjectId,
  ) {
    const file = await this.pdfFileModel.findById(fileId);

    if (!file) throw new BadRequestException('File id not found');

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const isOwner = userId === file.ownerId;
    const permission = file.sharedWith.find((sharedUser) => sharedUser.userId.equals(userObjectId));
    if ((!isOwner && permission?.access !== 'Edit') || userId === removedUser || removedUser === file.ownerId)
      throw new BadRequestException('You have no permission');
    
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
