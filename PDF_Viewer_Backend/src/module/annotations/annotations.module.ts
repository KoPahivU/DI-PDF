import { forwardRef, Module } from '@nestjs/common';
import { AnnotationsService } from './annotations.service';
import { AnnotationsController } from './annotations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from '@/auth/passport/jwt.strategy';
import { LocalStrategy } from '@/auth/passport/local.strategy';
import { AuthService } from '@/auth/auth.service';
import { AuthController } from '@/auth/auth.controller';
import { Annotation, AnnotationSchema } from './schemas/annotation.schema';
import { UserModule } from '../user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { PdfFilesModule } from '../pdf-files/pdf-files.module';
import { RedisModule } from '@/common/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Annotation.name, schema: AnnotationSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => PdfFilesModule),
    RedisModule,
    CacheModule.register(),
  ],
  controllers: [AnnotationsController, AuthController],
  providers: [AnnotationsService, AuthService, JwtStrategy, LocalStrategy],
  exports: [MongooseModule, AnnotationsService],
})
export class AnnotationsModule {}
