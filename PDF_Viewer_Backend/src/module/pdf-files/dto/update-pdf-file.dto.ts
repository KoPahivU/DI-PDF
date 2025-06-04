import { PartialType } from '@nestjs/mapped-types';
import { CreatePdfFileDto } from './create-pdf-file.dto';
import { IsNotEmpty } from 'class-validator';
import { ObjectId } from 'mongoose';

export class UpdatePdfFileDto extends PartialType(CreatePdfFileDto) {
  @IsNotEmpty()
  fileName: string;

  @IsNotEmpty()
  fileSize: number;

  @IsNotEmpty()
  ownerId: ObjectId;

  @IsNotEmpty()
  storagePath: string;
}
