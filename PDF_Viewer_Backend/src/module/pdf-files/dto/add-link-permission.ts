import { Prop } from '@nestjs/mongoose';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';
import { AccessLevel } from '../schemas/pdf-file.schema';

export class AddLinkPermissionDto {
  @IsNotEmpty()
  fileId: Types.ObjectId;

  @IsEnum(AccessLevel)
  access: AccessLevel;
}
