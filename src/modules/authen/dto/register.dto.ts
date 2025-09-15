import { IsDefined, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterUserDto {
  @IsDefined()
  @IsNotEmpty({ message: 'name must be a string' })
  name: string;

  @IsDefined()
  @IsNotEmpty({ message: 'name must be string' })
  password: string;

  @IsDefined()
  @IsNotEmpty({ message: 'name must be string' })
  email: string;

  @IsOptional()
  phone: string;
}
