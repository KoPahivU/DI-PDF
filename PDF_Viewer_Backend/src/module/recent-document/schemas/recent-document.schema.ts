import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class RecentDocument {
  @Prop()
  fileId: Types.ObjectId;

  @Prop()
  userId: Types.ObjectId;

  @Prop()
  date: string;
}
export const RecentDocumentSchema = SchemaFactory.createForClass(RecentDocument);
