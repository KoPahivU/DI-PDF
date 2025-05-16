import { IsNotEmpty } from 'class-validator';

export class CreatePdfFileDto {
  @IsNotEmpty()
  fileName: string;
  
  @IsNotEmpty()
  fileSize: number;
}
