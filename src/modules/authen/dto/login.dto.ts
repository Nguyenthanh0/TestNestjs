import { IsDefined, IsEmail, IsNotEmpty } from 'class-validator';

export class LoginUserDto {
  @IsDefined()
  @IsNotEmpty({ message: 'email must be a string' })
  @IsEmail()
  email: string;

  @IsDefined()
  @IsNotEmpty({ message: 'password must be string' })
  password: string;
}
