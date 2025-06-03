import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AnnotationsService } from './annotations.service';
import { CreateAnnotationDto } from './dto/create-annotation.dto';

@Controller('annotations')
export class AnnotationsController {
  constructor(private readonly annotationsService: AnnotationsService) {}

  @Post()
  async create(@Body() createAnnotationDto: CreateAnnotationDto) {
    return await this.annotationsService.create(createAnnotationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.annotationsService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.annotationsService.remove(id);
  }
}
