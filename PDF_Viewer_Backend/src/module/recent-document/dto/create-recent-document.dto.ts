import { IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class CreateRecentDocumentDto {
  @IsNotEmpty()
  fileId: string;
}
