import { IsString, IsEnum, IsOptional } from 'class-validator';
import { UpdateType } from '@prisma/client';

export class CreateCommentDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsEnum(UpdateType)
  type?: UpdateType;
}
