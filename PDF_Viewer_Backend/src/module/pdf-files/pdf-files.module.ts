import { forwardRef, Module } from '@nestjs/common';
import { PdfFilesService } from './pdf-files.service';
import { PdfFilesController } from './pdf-files.controller';
import { UserModule } from '../user/user.module';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { JwtStrategy } from '@/auth/passport/jwt.strategy';
import { LocalStrategy } from '@/auth/passport/local.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { PdfFile, PdfFileSchema } from './schemas/pdf-file.schema';
import { CloudinaryModule } from '@/common/cloudinary/cloudinary.module';
import { RecentDocumentModule } from '../recent-document/recent-document.module';
import { AnnotationsModule } from '../annotations/annotations.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisModule } from '@/common/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PdfFile.name, schema: PdfFileSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => RecentDocumentModule),
    forwardRef(() => AnnotationsModule),
    CloudinaryModule,
    RedisModule,
    CacheModule.register(),
  ],
  controllers: [PdfFilesController, AuthController],
  providers: [PdfFilesService, AuthService, JwtStrategy, LocalStrategy],
  exports: [PdfFilesService, MongooseModule],
})
export class PdfFilesModule {}
