import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'gmail is required' })
  gmail: string;

  @IsNotEmpty({ message: 'password is required' })
  password: string;
}
