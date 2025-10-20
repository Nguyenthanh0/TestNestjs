import {
  IsDefined,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class ForgetPasswordDto {
  @IsDefined()
  @IsNotEmpty({ message: 'email must be a string' })
  @IsEmail({}, { message: 'email must be valid' })
  email: string;

  @IsOptional()
  @IsString({ message: 'code must be a string' })
  code: string;

  @IsOptional()
  @IsIn(['vn', 'en'], { message: 'Ngôn ngữ không hợp lệ' })
  language?: 'vn' | 'en' = 'vn';
}
