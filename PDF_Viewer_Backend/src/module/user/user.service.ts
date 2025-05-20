import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { MailerService } from '@nestjs-modules/mailer';
import { hashPasswordHelper } from '@/common/helpers/util';
import dayjs from 'dayjs';
import { CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { SearchFileDto } from './dto/search-file.dto';
import { PdfFile } from '../pdf-files/schemas/pdf-file.schema';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(PdfFile.name)
    private pdfFileModel: Model<PdfFile>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  isEmailExist = async (gmail: string) => {
    const user = await this.userModel.exists({ gmail });
    if (user) return true;
    return false;
  };

  async create(createUserDto: CreateUserDto) {
    const { gmail, fullName, password } = createUserDto;

    const isExist = await this.isEmailExist(gmail);
    if (isExist) {
      throw new BadRequestException('Gmail has been used.');
    }

    const hashPassword = await hashPasswordHelper(password);
    const user = await this.userModel.create({
      gmail,
      fullName,
      password: hashPassword,
    });

    return {
      user,
    };
  }

  async getProfile(userId: string | Types.ObjectId) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new BadRequestException('User not found.');

    return user;
  }

  async getUserInformation(userId: string) {
    const objectId = new Types.ObjectId(userId);

    const user = await this.userModel.findById(objectId);

    if (!user) throw new BadRequestException('User not found.');

    return {
      _id: user._id,
      gmail: user.gmail,
      fullName: user.fullName,
      avatar: user.avatar,
    };
  }

  async searchUser(search: SearchFileDto, paginationDto: PaginationDto) {
    const file = await this.pdfFileModel.findById(search.fileId);
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    if (!file) throw new BadRequestException('File not found.');

    const excludedUserIds = [file.ownerId, ...file.sharedWith.map((u) => u.userId)];

    const filter = {
      $and: [{ _id: { $nin: excludedUserIds } }, { $text: { $search: search.searchInput } }],
    };

    const regex = new RegExp(search.searchInput, 'i');

    const user = await this.userModel
      .find({
        _id: { $nin: excludedUserIds },
        $or: [{ gmail: regex }, { fullName: regex }],
      })
      .skip(skip)
      .limit(limit);

    const total = await this.userModel.countDocuments({
      _id: { $nin: excludedUserIds },
      $or: [{ gmail: regex }, { fullName: regex }],
    });

    return {
      user,
      totalRecord: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async handleRegister(registerDto: CreateAuthDto) {
    const { gmail, password, fullName } = registerDto;

    const gmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!gmailRegex.test(gmail)) {
      throw new UnauthorizedException('Invalid gmail format');
    }

    const isExist = await this.isEmailExist(gmail);
    if (isExist) {
      throw new BadRequestException('Gmail has been used.');
    }

    const hashPassword = await hashPasswordHelper(password);
    const codeId = uuidv4();
    const user = await this.userModel.create({
      gmail,
      fullName,
      password: hashPassword,
      accountType: 'DEFAULT',
      isActive: false,
      codeId: codeId,
      codeExpired: dayjs().add(10, 'minutes'),
      usedStorage: 0,
    });

    this.mailerService.sendMail({
      to: user.gmail, // list of receivers
      subject: 'Activate your DI PDF account', // Subject line
      template: 'register',
      context: {
        url: process.env.FE_URI,
        name: user?.fullName ?? user.gmail,
        activationCode: codeId,
      },
      attachments: [
        {
          filename: 'logo.png',
          path: process.cwd() + '/src/mail/assets/logo.png',
          cid: 'logo',
        },
      ],
    });

    return {
      user,
    };
  }

  async findByGmail(gmail: string) {
    return await this.userModel.findOne({ gmail });
  }

  async handleActiveAccount(codeId: string) {
    if (!codeId) {
      throw new BadRequestException('Invalid activation code.');
    }

    const user = await this.userModel.findOne({ codeId: codeId });

    if (!user) {
      throw new BadRequestException('Invalid or expired activation code.');
    }

    if (dayjs().isAfter(user.codeExpired)) {
      await this.userModel.deleteOne({ _id: user._id });
      throw new BadRequestException('Activation code has expired.');
    }

    user.isActive = true;
    user.codeId = null;
    user.codeExpired = null;
    await user.save();

    const payload = { username: user.gmail, sub: user._id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
