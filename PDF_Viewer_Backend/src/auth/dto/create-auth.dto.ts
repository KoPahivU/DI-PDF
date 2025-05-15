import { Prop } from '@nestjs/mongoose';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAuthDto {
  @IsNotEmpty({ message: 'gmail is required' })
  gmail: string;

  @IsNotEmpty({ message: 'fullName is required' })
  fullName: string;

  @IsNotEmpty({ message: 'password is required' })
  password: string;

  @IsOptional()
  avatar: string;
}
