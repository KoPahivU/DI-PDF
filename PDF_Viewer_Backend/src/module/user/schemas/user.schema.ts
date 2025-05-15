import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEmpty, IsEnum, IsNotEmpty } from 'class-validator';

@Schema({ timestamps: true })
export class User {
  @Prop()
  gmail: string;

  @Prop()
  fullName: string;

  @Prop()
  password: string;

  @Prop()
  avatar: string;

  @Prop()
  @IsEnum(['GMAIL', 'DEFAULT'], {
    message: 'accountType must be a in the value: GMAIL, DEFAULT',
  })
  accountType: string;

  //   @Prop() //ADMIN, USER
  //   role: string;

  @Prop({ type: String, default: null })
  codeId: string | null; //Validation code send via email

  @Prop({ type: Date, default: null })
  codeExpired: Date | null;

  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  usedStorage: number;
}
export const UserSchema = SchemaFactory.createForClass(User);
