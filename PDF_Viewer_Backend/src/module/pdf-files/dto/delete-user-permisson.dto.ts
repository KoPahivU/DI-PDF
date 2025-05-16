import { IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class DeleteUserPermissionDto {
  @IsNotEmpty()
  fileId: Types.ObjectId;

  @IsNotEmpty()
  userId: Types.ObjectId;
}
