import { IsNotEmpty } from 'class-validator';
import { FileType } from '../schemas/pdf-file.schema';

export class CreatePdfFileDto {
  @IsNotEmpty()
  fileName: string;

  @IsNotEmpty()
  fileSize: number;

  @IsNotEmpty()
  type: FileType;
}
