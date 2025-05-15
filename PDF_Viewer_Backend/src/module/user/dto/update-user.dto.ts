import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  gmail: string;

  @IsOptional()
  fullName: string;

  @IsOptional()
  password: string;

  @IsOptional()
  avatar: string;

  //   @IsOptional() //ADMIN, USER
  //   role: string;
}
