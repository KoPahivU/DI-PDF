import { ObjectId, Types } from 'mongoose';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request } from '@nestjs/common';
import { RecentDocumentService } from './recent-document.service';
import { CreateRecentDocumentDto } from './dto/create-recent-document.dto';
import { UpdateRecentDocumentDto } from './dto/update-recent-document.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('recent-document')
export class RecentDocumentController {
  constructor(private readonly recentDocumentService: RecentDocumentService) {}

  @Post()
  create(@Body() fileId: CreateRecentDocumentDto, @Request() req) {
    return this.recentDocumentService.create(fileId.fileId, req.user._id);
  }

  @Get()
  findAll(@Query() page: PaginationDto, @Request() req) {
    return this.recentDocumentService.findAll(page, req?.user?._id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recentDocumentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRecentDocumentDto: UpdateRecentDocumentDto) {
    return this.recentDocumentService.update(+id, updateRecentDocumentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recentDocumentService.remove(+id);
  }
}
