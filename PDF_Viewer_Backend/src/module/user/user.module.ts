import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { CloudinaryModule } from '@/common/cloudinary/cloudinary.module';
import { PdfFilesModule } from '../pdf-files/pdf-files.module';
import { JwtStrategy } from '@/auth/passport/jwt.strategy';
import { LocalStrategy } from '@/auth/passport/local.strategy';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => PdfFilesModule),
    CloudinaryModule,
  ],
  controllers: [UserController],
  providers: [UserService, AuthService, JwtStrategy, LocalStrategy],
  exports: [UserService, MongooseModule],
})
export class UserModule {}
