import { IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class CreateAnnotationDto {
  @IsNotEmpty()
  pdfId: string;

  @IsNotEmpty()
  xfdf: string;
}
