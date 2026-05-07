import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  title!: string;

  @IsString()
  category_slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  target_date?: string;

  @IsOptional()
  @IsArray()
  inspiration_ids?: string[];
}

