import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreatePdfFileDto } from './dto/create-pdf-file.dto';
import { InjectModel } from '@nestjs/mongoose';
import { AccessLevel, FileType, PdfFile, SharedUser } from './schemas/pdf-file.schema';
import { Model, Types } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';
import { AddUserPermissionDto } from './dto/add-user-permission.dto';
import { v4 as uuidv4 } from 'uuid';
import { AddLinkPermissionDto } from './dto/add-link-permission.dto';
import { DeleteUserPermissionDto } from './dto/delete-user-permisson.dto';
import { DeleteLinkPermissionDto } from './dto/delete-link-permisson.dto';
import { RecentDocument } from '../recent-document/schemas/recent-document.schema';
import { IsPublicDto } from './dto/is-public.dto';
import { Annotation } from '../annotations/schemas/annotation.schema';
import Redis from 'ioredis';
import axios from 'axios';
import { ClientProxy } from '@nestjs/microservices';
import { AwsService } from '@/aws/aws.service';

@Injectable()
export class PdfFilesService {
  constructor(
    @InjectModel(PdfFile.name)
    private pdfFileModel: Model<PdfFile>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Annotation.name)
    private readonly annotationModel: Model<Annotation>,
    @InjectModel(RecentDocument.name)
    private readonly recentDocumentModel: Model<RecentDocument>,
    private readonly cloudinaryService: CloudinaryService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    @Inject('EMAIL_SERVICE') private client: ClientProxy,
    private readonly awsService: AwsService,
  ) {}

  async getLuminFile(signedId: string) {
    const configDownload = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://api.luminpdf.com/v1/signature_request/files_as_file_url/${signedId}`,
      headers: {
        Accept: 'application/json',
        'x-api-key': process.env.LUMIN_API_KEY,
      },
    };
    const luminDownloadResponse = await axios.request(configDownload);
    console.log(JSON.stringify(luminDownloadResponse.data));
    return luminDownloadResponse.data.file_url;
  }

  async uploadPdf(file: Express.Multer.File, userId: Types.ObjectId | string, fileSizeDto: CreatePdfFileDto) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new BadRequestException('User not found!');

    console.log(file.buffer);

    let storagePath: string = '';
    const newTotal = (Number(user.usedStorage) ?? 0) + Number(fileSizeDto.fileSize);
    if (newTotal > 1000000000) throw new BadRequestException('Out of memory!');

    await this.userModel.updateOne({ _id: userId }, { $set: { usedStorage: newTotal } });

    const fileKey = `pdfs/${Date.now()}-${file.originalname}`;
    const presignedUrl = await this.awsService.uploadFileAndGetPresignedUrl(fileKey, file.buffer, file.mimetype, 3600);

    // const cloudinaryResult: UploadApiResponse = await this.cloudinaryService.uploadPdf(file);
    // storagePath = cloudinaryResult.secure_url;

    storagePath = fileKey;

    let type = fileSizeDto.type;

    if (fileSizeDto.type === FileType.LUMIN) {
      try {
        const config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://api.luminpdf.com/v1/signature_request/send',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-api-key': process.env.LUMIN_API_KEY,
          },
          data: JSON.stringify({
            file_url: presignedUrl,
            title: fileSizeDto.fileName,
            signers: [
              {
                email_address: process.env.TEST_MAIL_1,
                name: 'Vu',
                group: 1,
              },
            ],
            viewers: [
              {
                email_address: process.env.TEST_MAIL_2,
                name: 'Le Vu',
              },
            ],
            expires_at: 1927510980694,
            use_text_tags: false,
            signing_type: 'ORDER',
          }),
        };
        const luminResponse = await axios.request(config);

        storagePath = luminResponse.data.signature_request.signature_request_id;
      } catch (error) {
        type = FileType.DEFAULT;
        storagePath = fileKey;
        console.error('LuminPDF API error:', error);

        if (axios.isAxiosError(error)) {
          console.error('Axios error response data:', error.response?.data);
          console.error('Axios error status:', error.response?.status);
          console.error('Axios error headers:', error.response?.headers);
        }
      }
    }

    const newPdfFile = await this.pdfFileModel.create({
      fileName: fileSizeDto.fileName,
      fileSize: fileSizeDto.fileSize,
      storagePath,
      ownerId: userId,
      type,
    });

    const newRecent = await this.recentDocumentModel.create({
      fileId: newPdfFile._id.toString(),
      userId: userId,
      date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    });

    const xfdfDefault = `<?xml version="1.0" encoding="UTF-8" ?><xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve"><pdf-info xmlns="http://www.pdftron.com/pdfinfo" version="2" import-version="4" /><fields /><annots><link page="0" rect="205.5,764.25,303,776.25" flags="print" name="b42c7108e90b6a20-82d75d7de885f322" width="0" style="solid"><apref gennum="0" objnum="7" x="205.5" y="776.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/"/></Action></OnActivation></link><link page="0" rect="303,764.25,410.25,776.25" flags="print" name="b42c7109e90b6a21-82d75d7ce885f321" width="0" style="solid"><apref gennum="0" objnum="8" x="303" y="776.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/"/></Action></OnActivation></link><link page="0" rect="29.25,744,63,752.25" flags="print" name="b42c710ae90b6a22-82d75d7be885f320" width="0" style="solid"><apref gennum="0" objnum="9" x="29.25" y="752.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/"/></Action></OnActivation></link><link page="0" rect="63,744,72,752.25" flags="print" name="b42c710be90b6a23-82d75d7ae885f31f" width="0" style="solid"><apref gennum="0" objnum="10" x="63" y="752.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/"/></Action></OnActivation></link><link page="0" rect="80.25,744,111,752.25" flags="print" name="b42c710ce90b6a24-82d75d79e885f31e" width="0" style="solid"><apref gennum="0" objnum="11" x="80.25" y="752.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/user"/></Action></OnActivation></link><link page="0" rect="111,744,135,752.25" flags="print" name="b42c710de90b6a25-82d75d78e885f31d" width="0" style="solid"><apref gennum="0" objnum="12" x="111" y="752.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/user"/></Action></OnActivation></link></annots><pages><defmtx matrix="1,0,0,-1,0,792" /></pages></xfdf>`;

    const newAnnotation = await this.annotationModel.create({
      pdfId: newPdfFile._id,
      xfdf: xfdfDefault,
    });

    const cached = await this.redisClient.set(newPdfFile._id.toString(), JSON.stringify(newAnnotation), 'EX', 300);
    console.log('Annotation from cache:', cached);

    return {
      newRecent,
      newPdfFile,
      newAnnotation,
    };
  }

  async updateRecent(fileId: Types.ObjectId | string, userId: Types.ObjectId | string, file: any) {
    const recentDoc = await this.recentDocumentModel.findOne({
      fileId,
      userId,
    });
    const newDate = new Date();

    if (recentDoc) {
      recentDoc.date = newDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      await recentDoc.save();
    } else {
      await this.recentDocumentModel.create({
        fileId: file._id.toString(),
        userId: userId,
        date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      });
    }
  }

  async getPdf(fileId: Types.ObjectId | string, userId: Types.ObjectId | string, shared: string | null) {
    const file = await this.pdfFileModel.findById(fileId);

    if (!file) throw new BadRequestException('File id not found');

    const isOwner = file.ownerId === userId;

    if (!isOwner && !file.isPublic) throw new BadRequestException('You have no permission');

    let permission: string | undefined;
    if (isOwner) permission = 'Owner';
    else {
      const sharedEntry = file.sharedWith.find((user) => user.userId.toString() === userId.toString());
      permission = sharedEntry?.access;
    }
    if (permission === undefined && !shared) throw new BadRequestException('You have no permission');

    const cacheKey = fileId.toString();
    let annotation: string | null = await this.redisClient.get(cacheKey);

    // Nếu cache không có, lấy từ DB
    if (!annotation) {
      annotation = await this.annotationModel.findOne({ pdfId: file._id });

      if (!annotation) {
        throw new BadRequestException('Annotation not found');
      }

      await this.redisClient.set(cacheKey, JSON.stringify(annotation), 'EX', 300);
      console.log('New cache data.');
    }

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const ownerInformation = await this.userModel.findById(file.ownerId);

    if (typeof annotation === 'string') annotation = JSON.parse(annotation);

    let presignedUrl: string | null;

    if (file.type === FileType.DEFAULT) presignedUrl = await this.awsService.getPresignedUrl(file.storagePath, 3600);
    else presignedUrl = await this.getLuminFile(file.storagePath);

    if (shared) {
      const sharedItem = file.sharedLink.find((link) => link.token === shared);
      if (!sharedItem) {
        throw new BadRequestException('Shared not found');
      }

      let access = 'Guest';

      if (userId) {
        this.updateRecent(fileId, userId, file);
        const sharedUserIndex = file.sharedWith.findIndex((user) => user.userId.equals(userObjectId));

        if (sharedUserIndex !== -1) {
          file.sharedWith[sharedUserIndex].access = sharedItem.access;
        } else {
          file.sharedWith.push({
            userId: userObjectId,
            access: sharedItem.access,
          });
        }

        file.markModified('sharedWith');
        await file.save();

        access = isOwner ? 'Owner' : sharedItem.access;
      }

      return {
        file,
        owner: {
          gmail: ownerInformation?.gmail,
          fullName: ownerInformation?.fullName,
          avatar: ownerInformation?.avatar,
        },
        annotation,
        access,
        url: presignedUrl,
      };
    }

    if (permission !== undefined) {
      this.updateRecent(fileId, userId, file);
      return {
        file,
        owner: {
          gmail: ownerInformation?.gmail,
          fullName: ownerInformation?.fullName,
          avatar: ownerInformation?.avatar,
        },
        annotation: annotation,
        access: isOwner ? 'Owner' : permission,
        url: presignedUrl,
      };
    }

    throw new BadRequestException('Shared not found');
  }

  async setIsPublic(body: IsPublicDto, userId: Types.ObjectId | string) {
    const file = await this.pdfFileModel.findById(body.fileId);
    if (!file) throw new BadRequestException('File id not found');

    // console.log(file.ownerId, "   ", userId)

    const isOwner = file.ownerId === userId;
    if (!isOwner) throw new BadRequestException('You have no permission');

    file.isPublic = body.isPublic;

    if (file.isPublic) {
      const editToken = uuidv4();

      file.sharedLink.push({
        access: AccessLevel.EDIT,
        token: editToken,
      });

      let viewToken;

      do {
        viewToken = uuidv4();
      } while (viewToken === editToken);

      file.sharedLink.push({
        access: AccessLevel.VIEW,
        token: viewToken,
      });
    } else {
      file.sharedLink = [];
      file.sharedWith = [];
    }

    await file.save();

    return file;
  }

  async handleCheckUserPermission(userId: string | Types.ObjectId, userPermission: AddUserPermissionDto) {
    const file = await this.pdfFileModel.findById(userPermission.fileId);

    if (!file) throw new BadRequestException('File id not found');

    const targetUserObjectId =
      typeof userPermission.userId === 'string' ? new Types.ObjectId(userPermission.userId) : userPermission.userId;

    const isOwner = file.ownerId === userId;

    if (!isOwner) throw new BadRequestException('You have no permission');

    return { file, targetUserObjectId };
  }

  async addUserPermission(userId: string | Types.ObjectId, userPermission: AddUserPermissionDto) {
    const { file, targetUserObjectId } = await this.handleCheckUserPermission(userId, userPermission);

    const sharedUserIndex = file.sharedWith.findIndex((user) => user.userId.equals(targetUserObjectId));

    if (sharedUserIndex !== -1) {
      if (userPermission.access === 'Remove') {
        const deletedData = await this.recentDocumentModel.deleteOne({
          fileId: file._id.toString(),
          userId: userPermission.userId.toString(),
        });
        file.sharedWith.splice(sharedUserIndex, 1);
      } else {
        file.sharedWith[sharedUserIndex].access = userPermission.access;
      }
    } else {
      if (userPermission.access === 'Remove') return;

      const newData = {
        userId: targetUserObjectId,
        access: userPermission.access,
      };
      file.sharedWith.push(newData as SharedUser);
      await this.recentDocumentModel.create({
        fileId: file._id.toString(),
        userId: userPermission.userId,
        date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      });

      const user = await this.userModel.findById(userPermission.userId);
      const owner = await this.userModel.findById(userId);

      await this.client.emit('send_invitation', { user, owner, userPermission, file });
    }

    file.markModified('sharedWith');
    await file.save();

    return file;
  }

  async handleCheckLinkPermission(userId: string | Types.ObjectId, addLinkPermission: AddLinkPermissionDto) {
    const file = await this.pdfFileModel.findById(addLinkPermission.fileId);

    if (!file) throw new BadRequestException('File id not found');

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const isOwner = userId === file.ownerId;
    const permission = file.sharedWith.find((sharedUser) => sharedUser.userId.equals(userObjectId));
    if (!isOwner && permission?.access !== 'Edit') throw new BadRequestException('You have no permission');

    return file;
  }

  async addLinkPermission(userId: string | Types.ObjectId, addLinkPermission: AddLinkPermissionDto) {
    const file = await this.handleCheckLinkPermission(userId, addLinkPermission);
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

  async removeUserPermission(userId: string | Types.ObjectId, removeUser: DeleteUserPermissionDto) {
    const file = await this.pdfFileModel.findById(removeUser.fileId);

    if (!file) throw new BadRequestException('File id not found');

    const isOwner = userId === file.ownerId;
    if (!isOwner || removeUser.userId === file.ownerId) throw new BadRequestException('You have no permission');

    const user = file.sharedWith.findIndex((remove) => remove.userId === removeUser.userId);
    if (user) {
      file.sharedWith.splice(user, 1);
      file.markModified('sharedWith');
      await file.save();

      return { message: 'Permission removed successfully' };
    } else throw new BadRequestException('User not found');
  }

  async removeLinkPermission(userId: string | Types.ObjectId, removeLink: DeleteLinkPermissionDto) {
    const file = await this.pdfFileModel.findById(removeLink.fileId);

    if (!file) throw new BadRequestException('File id not found');

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const isOwner = userId === file.ownerId;
    if (!isOwner) throw new BadRequestException('You have no permission');

    const link = file.sharedLink.findIndex((remove) => remove.token === removeLink.token);
    if (link) {
      file.sharedLink.splice(link, 1);
      file.markModified('sharedLink');
      await file.save();

      return { message: 'Permission removed successfully' };
    } else throw new BadRequestException('Link not found');
  }
}
