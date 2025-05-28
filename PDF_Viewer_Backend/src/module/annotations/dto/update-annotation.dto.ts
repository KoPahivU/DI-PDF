import { PartialType } from '@nestjs/mapped-types';
import { CreateAnnotationDto } from './create-annotation.dto';
import { IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateAnnotationDto extends PartialType(CreateAnnotationDto) {
  @IsNotEmpty()
  pdfId: string;

  @IsNotEmpty()
  xfdf: string;
}
