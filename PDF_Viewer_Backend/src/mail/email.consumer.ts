import { ObjectId, Types } from 'mongoose';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '@/module/user/schemas/user.schema';
import { AddUserPermissionDto } from '@/module/pdf-files/dto/add-user-permission.dto';
import { PdfFile } from '@/module/pdf-files/schemas/pdf-file.schema';

interface Invite {
  user: User;
  owner: User;
  userPermission: AddUserPermissionDto;
  file: any;
}

@Controller()
export class EmailConsumer {
  constructor(private readonly mailerService: MailerService) {}

  @EventPattern('send_activation_email')
  async handleSendActivationEmail(@Payload() data: any) {
    const { to, name, code } = data;

    await this.mailerService.sendMail({
      to,
      subject: 'Activate your DI PDF account',
      template: 'register',
      context: {
        url: process.env.FE_URI,
        name,
        activationCode: code,
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

  @EventPattern('send_invitation')
  async handleSendInvitation(@Payload() data: Invite) {
    const { user, owner, userPermission, file } = data;
    await this.mailerService.sendMail({
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
}
