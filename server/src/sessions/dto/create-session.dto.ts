import { IsString, IsEnum, IsOptional } from 'class-validator';
import { SessionIntent } from '@prisma/client';

export class CreateSessionDto {
  @IsEnum(SessionIntent)
  intent!: SessionIntent;

  @IsOptional()
  @IsString()
  category_slug?: string;
}
