import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateUserDto {
  @IsNotEmpty()
  gmail: string;

  @IsNotEmpty()
  fullName: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  avatar: string;
}
