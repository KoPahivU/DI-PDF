import { IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class SearchFileDto {
  @IsNotEmpty()
  fileId: string;

  @IsNotEmpty()
  searchInput: string;
}
