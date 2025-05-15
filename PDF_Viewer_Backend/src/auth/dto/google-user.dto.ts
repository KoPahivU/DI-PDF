import { IsNotEmpty, IsOptional } from 'class-validator';

export class GoogleUserDto {
  @IsNotEmpty()
  gmail: string;

  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  avatar: string;
}
