import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string;
}
