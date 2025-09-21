import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEmail()
  @IsString({ message: 'email must be a string' })
  email: string;

  @IsOptional()
  @IsString({ message: 'password must be a string' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @ApiProperty() // gợi ý kiểu dữ liệu truyền vào field
  name: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MinLength(10, { message: 'phone must have 10 character' })
  @MaxLength(10, { message: 'Phone must have 10 character' })
  phone: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address: string;

  @IsOptional()
  @IsString({ message: 'Image must be a string' })
  image: string;
}
