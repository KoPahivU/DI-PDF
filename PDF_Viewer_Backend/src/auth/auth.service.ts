import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { MailerService } from '@nestjs-modules/mailer';
import { CreateUserDto } from '@/module/user/dto/create-user.dto';
import { User } from '@/module/user/schemas/user.schema';
import { UserService } from '@/module/user/user.service';
import { comparePasswordHelper } from '@/common/helpers/util';
import { LoginDto } from './dto/login.dto';
import { GoogleUserDto } from './dto/google-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async validateUser(gmail: string, pass: string): Promise<any> {
    const user = await this.userService.findByGmail(gmail);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValidPassword = await comparePasswordHelper(pass, user.password);

    if (!user || !isValidPassword) return null;

    return user;
  }

  async login(loginDto: LoginDto) {
    const { gmail, password } = loginDto;

    const user = await this.userService.findByGmail(gmail);

    if (!user) throw new UnauthorizedException('Account does not exist.');

    if (user?.accountType === 'GMAIL') throw new UnauthorizedException('This is a google login account.');

    if (user?.isActive === false) throw new UnauthorizedException("Account isn't active yet.");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Wrong password.');
    }

    const payload = { username: user.gmail, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  handleRegister = async (registerDto: CreateAuthDto) => {
    return await this.userService.handleRegister(registerDto);
  };

  sendLink = async (registerDto: CreateAuthDto) => {
    const user = await this.userService.findByGmail(registerDto.gmail);

    if (!user) throw new UnauthorizedException('Account does not exist.');

    if (user?.accountType === 'GMAIL') throw new UnauthorizedException('This is a google login account.');

    if (user.codeExpired) {
      const currentTime = new Date();
      const codeExpiryTime = new Date(user.codeExpired);

      if (currentTime > codeExpiryTime) {
        throw new UnauthorizedException('The code has expired.');
      }
    }

    this.mailerService.sendMail({
      to: user.gmail,
      subject: 'Activate your DI PDF account',
      template: 'register',
      context: {
        url: process.env.FE_URI,
        name: user?.fullName ?? user.gmail,
        activationCode: user.codeId,
      },
      attachments: [
        {
          filename: 'logo.png',
          path: process.cwd() + '/src/mail/assets/logo.png',
          cid: 'logo',
        },
      ],
    });

    return { user };
  };

  async verifyCode(codeId: string): Promise<{ access_token: string }> {
    return await this.userService.handleActiveAccount(codeId);
  }

  async changePassword(userId, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found...');
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newHashedPassword;
    await user.save();
  }

  async forgotPassword(gmail: string) {
    const user = await this.userModel.findOne({ gmail });

    if (user) {
      const payload = { username: user?.gmail, sub: user?._id };
      const token = this.jwtService.sign(payload);

      this.mailerService.sendMail({
        to: user.gmail, // list of receivers
        subject: 'Password Reset Request', // Subject line
        template: 'forgot_password',
        context: {
          name: user.fullName,
          resetLink: `${process.env.FE_URI}/reset-password?token=${token}`,
        },
      });

      return 'Email sended';
    }

    throw new NotFoundException('Gmail not found...');
  }

  async validateGoogleUser(googleUser: GoogleUserDto) {
    const user = await this.userService.findByGmail(googleUser.gmail);

    if (user) {
      if (user.accountType != 'GMAIL') throw new Error('This account have a password');
      const payload = { username: user.gmail, sub: user._id };

      return {
        user: user,
        access_token: this.jwtService.sign(payload),
      };
    }

    return await this.userModel.create({
      gmail: googleUser.gmail,
      fullName: googleUser.fullName,
      avatar: googleUser.avatar,
      accountType: 'GMAIL',
      isActive: true,
      usedStorage: 0,
    });
  }
}
