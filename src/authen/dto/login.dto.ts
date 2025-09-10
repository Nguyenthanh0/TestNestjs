import { IsDefined, IsNotEmpty } from 'class-validator';

export class LoginUserDto {
  @IsDefined()
  @IsNotEmpty({ message: 'name must be a string' })
  name: string;

  @IsDefined()
  @IsNotEmpty({ message: 'name must be string' })
  password: string;
}
