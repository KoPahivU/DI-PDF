import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { Annotation } from './schemas/annotation.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
@Injectable()
export class AnnotationsService {
  constructor(
    @InjectModel(Annotation.name)
    private annotationModel: Model<Annotation>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createAnnotationDto: CreateAnnotationDto) {
    const pdfId = new Types.ObjectId(createAnnotationDto.pdfId);

    const cacheKey = createAnnotationDto.pdfId.toString();

    let annotationCache = await this.cacheManager.get<Annotation>(cacheKey);
    if (!annotationCache) {
      annotationCache = await this.annotationModel.findOne({ pdfId });

      await this.cacheManager.set(cacheKey, annotationCache, 3600);
      console.log('New cache data');
    } else {
      console.log('Update cache data');
      await this.cacheManager.set(cacheKey, annotationCache, 3600);
    }

    const annotation = await this.annotationModel.findOne({ pdfId });

    if (!annotation) {
      const xfdfDefault = `<?xml version="1.0" encoding="UTF-8" ?><xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve"><pdf-info xmlns="http://www.pdftron.com/pdfinfo" version="2" import-version="4" /><fields /><annots><link page="0" rect="205.5,764.25,303,776.25" flags="print" name="b42c7108e90b6a20-82d75d7de885f322" width="0" style="solid"><apref gennum="0" objnum="7" x="205.5" y="776.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/"/></Action></OnActivation></link><link page="0" rect="303,764.25,410.25,776.25" flags="print" name="b42c7109e90b6a21-82d75d7ce885f321" width="0" style="solid"><apref gennum="0" objnum="8" x="303" y="776.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/"/></Action></OnActivation></link><link page="0" rect="29.25,744,63,752.25" flags="print" name="b42c710ae90b6a22-82d75d7be885f320" width="0" style="solid"><apref gennum="0" objnum="9" x="29.25" y="752.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/"/></Action></OnActivation></link><link page="0" rect="63,744,72,752.25" flags="print" name="b42c710be90b6a23-82d75d7ae885f31f" width="0" style="solid"><apref gennum="0" objnum="10" x="63" y="752.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/"/></Action></OnActivation></link><link page="0" rect="80.25,744,111,752.25" flags="print" name="b42c710ce90b6a24-82d75d79e885f31e" width="0" style="solid"><apref gennum="0" objnum="11" x="80.25" y="752.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/user"/></Action></OnActivation></link><link page="0" rect="111,744,135,752.25" flags="print" name="b42c710de90b6a25-82d75d78e885f31d" width="0" style="solid"><apref gennum="0" objnum="12" x="111" y="752.25"/><OnActivation><Action Trigger="U"><URI Name="https://daa.uit.edu.vn/user"/></Action></OnActivation></link></annots><pages><defmtx matrix="1,0,0,-1,0,792" /></pages></xfdf>`;
      const annotation = await this.annotationModel.create({
        pdfId: createAnnotationDto.pdfId,
        xfdf: xfdfDefault,
      });
      return {
        annotation,
      };
    }

    annotation.xfdf = createAnnotationDto.xfdf;
    await annotation.save();

    return annotation;
  }

  async findOne(fileId: string) {
    const annotation = await this.annotationModel.findOne({ pdfId: fileId });

    if (!annotation) throw new BadRequestException('Annotation not found!');

    return annotation;
  }

  async remove(fileId: string) {
    const pdfId = new Types.ObjectId(fileId);
    const annotation = await this.annotationModel.findById({ pdfId });

    if (!annotation) throw new BadRequestException('Annotation not found!');

    await this.annotationModel.deleteOne({ pdfId: new Types.ObjectId(fileId) });
    return annotation;
  }
}
