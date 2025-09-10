import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @IsDefined({ message: 'Name is required' })
  @IsNotEmpty({ message: 'Name must not be empty' })
  @IsString({ message: 'Name must be a string' })
  @ApiProperty() // gợi ý kiểu dữ liệu truyền vào field
  name: string;

  // Bắt buộc nhập, phải là email
  @IsDefined({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  // Bắt buộc nhập, tối thiểu 6 ký tự
  @IsDefined({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  // Optional field, có thể không gửi
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

  @IsOptional()
  role: UserRole;
}
