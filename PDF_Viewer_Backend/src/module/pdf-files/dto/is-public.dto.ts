import { IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class IsPublicDto {
  @IsNotEmpty()
  fileId: Types.ObjectId;

  @IsNotEmpty()
  isPublic: boolean;
}
