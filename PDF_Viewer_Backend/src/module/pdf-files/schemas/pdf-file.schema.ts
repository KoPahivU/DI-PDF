import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';

export enum AccessLevel {
  VIEW = 'view',
  EDIT = 'edit',
  COMMENT = 'comment',
}

@Schema()
class SharedUser {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ enum: AccessLevel, default: AccessLevel.VIEW })
  access: AccessLevel;
}

@Schema()
class SharedLink {
  @Prop({ default: false })
  enabled: boolean;

  @Prop({ enum: AccessLevel, default: AccessLevel.VIEW })
  access: AccessLevel;

  @Prop({ unique: true, sparse: true })
  token: string;
}

@Schema({ timestamps: true })
export class PdfFile {
  @Prop()
  fileName: string;

  @Prop()
  fileSize: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerId: Types.ObjectId;

  @Prop()
  storagePath: string;

  @Prop()
  thumbnailUrl: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ type: [SharedUser], default: [] })
  sharedWith: SharedUser[];

  @Prop({ type: SharedLink, default: () => ({}) })
  sharedLink: SharedLink;
}
export const PdfFileSchema = SchemaFactory.createForClass(PdfFile);
