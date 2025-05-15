import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Request,
  Query,
} from '@nestjs/common';
import { PdfFilesService } from './pdf-files.service';
import { CreatePdfFileDto } from './dto/create-pdf-file.dto';
import { UpdatePdfFileDto } from './dto/update-pdf-file.dto';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectId } from 'mongoose';

@Controller('pdf-files')
export class PdfFilesController {
  constructor(private readonly pdfFilesService: PdfFilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'D:/uploads/',
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    }),
  )
  async uploadPdf(@UploadedFile() file: Express.Multer.File, @Request() req, @Body() fileSize: CreatePdfFileDto) {
    return await this.pdfFilesService.uploadPdf(file, req.user._id, fileSize);
  }

  @Get()
  async getPdf(@Query('id') id: string) {
    return await this.pdfFilesService.getPdf(id);
  }

  @Post()
  create(@Body() createPdfFileDto: CreatePdfFileDto) {
    return this.pdfFilesService.create(createPdfFileDto);
  }

  @Get()
  findAll() {
    return this.pdfFilesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pdfFilesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePdfFileDto: UpdatePdfFileDto) {
    return this.pdfFilesService.update(+id, updatePdfFileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pdfFilesService.remove(+id);
  }
}
