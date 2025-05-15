import { IsNotEmpty } from "class-validator";
import { ObjectId } from "mongoose";

export class CreatePdfFileDto {
  @IsNotEmpty()
  fileSize: number;
}
