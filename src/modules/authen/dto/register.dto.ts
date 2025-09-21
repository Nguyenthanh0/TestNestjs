import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class RegisterUserDto {
  @IsDefined()
  @IsNotEmpty({ message: 'name must be a string' })
  @IsString({ message: 'name must be a string' })
  name: string;

  @IsDefined()
  @IsNotEmpty({ message: 'password must be string' })
  @Length(5, 255)
  password: string;

  @IsDefined()
  @IsNotEmpty({ message: 'email must be string' })
  @IsEmail()
  email: string;

  @IsOptional()
  phone: string;
}
