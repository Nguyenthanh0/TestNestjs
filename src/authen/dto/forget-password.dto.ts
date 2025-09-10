import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class ForgetPasswordDto {
  @IsDefined()
  @IsNotEmpty({ message: 'email must be a string' })
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString({ message: 'code must be a string' })
  code: string;

  @IsOptional()
  @IsString({ message: 'code must be a string' })
  @MinLength(8, { message: 'newpass is at least 6 characters' })
  newpass: string;
}
