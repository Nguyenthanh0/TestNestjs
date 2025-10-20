import { IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  content: string;
}
