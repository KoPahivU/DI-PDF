import { IsEnum, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { AccessLevel } from '../schemas/pdf-file.schema';

export class AddUserPermissionDto {
  @IsMongoId()
  fileId: Types.ObjectId;

  @IsMongoId()
  userId: Types.ObjectId;

  @IsEnum(AccessLevel)
  access: AccessLevel;
}
