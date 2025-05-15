import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthDto } from './create-auth.dto';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {
  @IsNotEmpty({ message: 'gmail is required' })
  gmail: string;

  @IsNotEmpty({ message: 'fullName is required' })
  fullName: string;

  @IsNotEmpty({ message: 'password is required' })
  password: string;

  @IsOptional()
  avatar: string;
}
