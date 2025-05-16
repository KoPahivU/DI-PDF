import { IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class DeleteLinkPermissionDto {
  @IsNotEmpty()
  fileId: Types.ObjectId;

  @IsNotEmpty()
  token: string;
}
