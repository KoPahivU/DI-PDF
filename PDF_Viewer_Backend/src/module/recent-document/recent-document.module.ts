import { forwardRef, Module } from '@nestjs/common';
import { RecentDocumentService } from './recent-document.service';
import { RecentDocumentController } from './recent-document.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RecentDocument, RecentDocumentSchema } from './schemas/recent-document.schema';
import { UserModule } from '../user/user.module';
import { PdfFilesModule } from '../pdf-files/pdf-files.module';
import { AuthService } from '@/auth/auth.service';
import { JwtStrategy } from '@/auth/passport/jwt.strategy';
import { LocalStrategy } from '@/auth/passport/local.strategy';
import { EmailModule } from '@/mail/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RecentDocument.name, schema: RecentDocumentSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => PdfFilesModule),
    EmailModule,
  ],
  controllers: [RecentDocumentController],
  providers: [RecentDocumentService, AuthService, JwtStrategy, LocalStrategy],
  exports: [RecentDocumentService, MongooseModule],
})
export class RecentDocumentModule {}
