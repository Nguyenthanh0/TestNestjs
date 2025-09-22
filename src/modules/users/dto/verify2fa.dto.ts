import { IsDefined, IsOptional, IsString } from 'class-validator';

export class Verify2faUserDto {
  @IsDefined()
  @IsString({ message: 'code must be a string' })
  code: string;

  @IsOptional()
  @IsString()
  temptoken: string;
}
