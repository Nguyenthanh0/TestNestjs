import { IsDefined, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsDefined()
  content: string;
}
