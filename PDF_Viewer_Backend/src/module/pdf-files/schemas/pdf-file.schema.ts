import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';

export enum AccessLevel {
  VIEW = 'View',
  EDIT = 'Edit',
  GUEST = 'Guest',
  REMOVE = 'Remove',
}

export enum FileType {
  DEFAULT = 'Default',
  LUMIN = 'Lumin',
}

@Schema()
export class SharedUser {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ enum: AccessLevel, default: AccessLevel.VIEW })
  access: AccessLevel;
}

@Schema()
export class SharedLink {
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
  type: FileType;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ type: [SharedUser], default: [] })
  sharedWith: SharedUser[];

  @Prop({ type: [SharedLink], default: [] })
  sharedLink: SharedLink[];
}
export const PdfFileSchema = SchemaFactory.createForClass(PdfFile);
export const SharedUserSchema = SchemaFactory.createForClass(SharedUser);
export const SharedLinkSchema = SchemaFactory.createForClass(SharedLink);
