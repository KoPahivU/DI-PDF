import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Annotation {
  @Prop()
  pdfId: string;

  @Prop()
  xfdf: string;
}
export const AnnotationSchema = SchemaFactory.createForClass(Annotation);
