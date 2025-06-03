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
import { CreatePdfFileDto } from './dto/create-pdf-file.dto.dto';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { AddUserPermissionDto } from './dto/add-user-permission.dto';
import { AddLinkPermissionDto } from './dto/add-link-permission.dto';
import { DeleteUserPermissionDto } from './dto/delete-user-permisson.dto';
import { Public } from '@/common/decorator/customize';
import { IsPublicDto } from './dto/is-public.dto';
import { DeleteLinkPermissionDto } from './dto/delete-link-permisson.dto';

@Controller('pdf-files')
export class PdfFilesController {
  constructor(private readonly pdfFilesService: PdfFilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
      storage: diskStorage({
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
      fileFilter: (req, file, cb) => {
        console.log(`Uploading file: ${file.filename}, size limit: 20MB`);
        cb(null, true);
      },
    }),
  )
  async uploadPdf(@UploadedFile() file: Express.Multer.File, @Request() req, @Body() fileSize: CreatePdfFileDto) {
    return await this.pdfFilesService.uploadPdf(file, req.user._id, fileSize);
  }

  @Get(':id')
  @Public()
  async getPdf(@Param('id') id: string, @Request() req, @Query('shared') shared: string) {
    return await this.pdfFilesService.getPdf(id, req?.user?._id, shared);
  }

  @Patch('public')
  async setIsPublic(@Body() body: IsPublicDto, @Request() req) {
    return await this.pdfFilesService.setIsPublic(body, req.user._id);
  }

  @Post('add-user-permission')
  async addUserPermission(@Request() req, @Body() userPermission: AddUserPermissionDto) {
    return await this.pdfFilesService.addUserPermission(req.user._id, userPermission);
  }

  @Post('add-link-permission')
  async addLinkPermission(@Request() req, @Body() addLinkPermission: AddLinkPermissionDto) {
    return await this.pdfFilesService.addLinkPermission(req.user._id, addLinkPermission);
  }

  @Patch('update-user-permission')
  async updateUserPermission(@Request() req) {}

  @Delete('delete-user-permission')
  async removeUserPermission(@Request() req, @Body() body: DeleteUserPermissionDto) {
    return await this.pdfFilesService.removeUserPermission(req.user._id, body);
  }

  @Delete('delete-link-permission')
  async removeLinkPermission(@Request() req, @Body() body: DeleteLinkPermissionDto) {
    return await this.pdfFilesService.removeLinkPermission(req.user._id, body);
  }
}
