import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreatePdfFileDto } from './dto/create-pdf-file.dto.dto';
import { UpdatePdfFileDto } from './dto/update-pdf-file.dto';
import { InjectModel } from '@nestjs/mongoose';
import { AccessLevel, PdfFile, SharedUser } from './schemas/pdf-file.schema';
import { Model, ObjectId, Types } from 'mongoose';
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
import { MailerService } from '@nestjs-modules/mailer';
import { Annotation } from '../annotations/schemas/annotation.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

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
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async uploadPdf(file: Express.Multer.File, userId: Types.ObjectId | string, fileSizeDto: CreatePdfFileDto) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new BadRequestException('User not found!');

    const newTotal = (Number(user.usedStorage) ?? 0) + Number(fileSizeDto.fileSize);
    if (newTotal > 1000000000) throw new BadRequestException('Out of memory!');

    await this.userModel.updateOne({ _id: userId }, { $set: { usedStorage: newTotal } });

    const cloudinaryResult: UploadApiResponse = await this.cloudinaryService.uploadPdf(file);

    const newPdfFile = await this.pdfFileModel.create({
      fileName: fileSizeDto.fileName,
      fileSize: fileSizeDto.fileSize,
      storagePath: cloudinaryResult.secure_url,
      ownerId: userId,
      thumbnailUrl: '',
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

    const cached = await this.cacheManager.set(newPdfFile._id.toString(), newAnnotation, 120);
    console.log('Annotation from cache:', cached);

    return {
      newRecent,
      newPdfFile,
      newAnnotation,
    };
  }

  async getPdf(fileId: Types.ObjectId | string, userId: Types.ObjectId | string, shared: string | null) {
    const file = await this.pdfFileModel.findById(fileId);

    if (!file) throw new BadRequestException('File id not found');

    let annotation = await this.cacheManager.get(fileId.toString());
    annotation = annotation ? annotation : await this.annotationModel.findOne({ pdfId: file._id });

    if (annotation)  throw new BadRequestException('Annotation not found');
    // const annotation =

    const isOwner = file.ownerId === userId;

    if (!isOwner && !file.isPublic) throw new BadRequestException('You have no permission');

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const ownerInformation = await this.userModel.findById(file.ownerId);

    if (userId) {
      const recentDoc = await this.recentDocumentModel.findOne({
        fileId: fileId,
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

    if (shared) {
      const sharedItem = file.sharedLink.find((link) => link.token === shared);
      if (sharedItem) {
        if (userId) {
          const sharedUser = file.sharedWith.find((user) => {
            return user.userId.equals(userObjectId);
          });
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

          return {
            file: file,
            owner: {
              gmail: ownerInformation?.gmail,
              fullName: ownerInformation?.fullName,
              avatar: ownerInformation?.avatar,
            },
            annotation,
            access: isOwner ? 'Owner' : sharedItem?.access,
          };
        }
        return {
          file,
          owner: {
            gmail: ownerInformation?.gmail,
            fullName: ownerInformation?.fullName,
            avatar: ownerInformation?.avatar,
          },
          annotation,
          access: 'Guest',
        };
      } else throw new BadRequestException('Shared not found');
    }

    if (userId) {
      if (isOwner)
        return {
          file,
          owner: {
            gmail: ownerInformation?.gmail,
            fullName: ownerInformation?.fullName,
            avatar: ownerInformation?.avatar,
          },
          annotation,
          access: 'Owner',
        };

      const permission = file.sharedWith.find((user) => user.userId.toString() === userId.toString());
      if (!permission) throw new BadRequestException('You have no permission');

      return {
        file,
        owner: {
          gmail: ownerInformation?.gmail,
          fullName: ownerInformation?.fullName,
          avatar: ownerInformation?.avatar,
        },
        annotation,
        access: permission.access,
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

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const targetUserObjectId =
      typeof userPermission.userId === 'string' ? new Types.ObjectId(userPermission.userId) : userPermission.userId;

    const isOwner = file.ownerId === userId;
    const permission = file.sharedWith.find((sharedUser) => sharedUser.userId.equals(userObjectId));

    if ((!isOwner && permission?.access !== 'Edit') || !file.isPublic)
      throw new BadRequestException('You have no permission');

    return { file, targetUserObjectId };
  }

  async addUserPermission(userId: string | Types.ObjectId, userPermission: AddUserPermissionDto) {
    const { file, targetUserObjectId } = await this.handleCheckUserPermission(userId, userPermission);

    const sharedUserIndex = file.sharedWith.findIndex((user) => user.userId.equals(targetUserObjectId));

    if (sharedUserIndex !== -1) {
      if (userPermission.access === 'Remove') {
        await this.recentDocumentModel.deleteMany({
          fileId: file._id.toString(),
          userId: userPermission.userId.toString(),
        });
        file.sharedWith.splice(sharedUserIndex, 1);
      } else {
        file.sharedWith[sharedUserIndex].access = userPermission.access;
      }
    } else {
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
      this.mailerService.sendMail({
        to: user?.gmail,
        subject: 'DI-PDF Invite Email',
        template: 'invite',
        context: {
          owner: owner?.fullName,
          permission: userPermission.access,
          fileName: file.fileName,
          inviteName: user?.fullName,
          url: `${process.env.FE_URI}/file/${file._id}`,
        },
        attachments: [
          {
            filename: 'logo.png',
            path: process.cwd() + '/src/mail/assets/logo.png',
            cid: 'logo',
          },
        ],
      });
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

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const isOwner = userId === file.ownerId;
    const permission = file.sharedWith.find((sharedUser) => sharedUser.userId.equals(userObjectId));
    if (
      (!isOwner && permission?.access !== 'Edit') ||
      userId === removeUser.userId ||
      removeUser.userId === file.ownerId
    )
      throw new BadRequestException('You have no permission');

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
    const permission = file.sharedWith.find((sharedUser) => sharedUser.userId.equals(userObjectId));
    if (!isOwner && permission?.access !== 'Edit') throw new BadRequestException('You have no permission');

    const link = file.sharedLink.findIndex((remove) => remove.token === removeLink.token);
    if (link) {
      file.sharedLink.splice(link, 1);
      file.markModified('sharedLink');
      await file.save();

      return { message: 'Permission removed successfully' };
    } else throw new BadRequestException('Link not found');
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
