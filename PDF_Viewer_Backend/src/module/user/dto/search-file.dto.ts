import { IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class SearchFileDto {
  @IsNotEmpty()
  fileId: Types.ObjectId;

  @IsNotEmpty()
  searchInput: string;
}
