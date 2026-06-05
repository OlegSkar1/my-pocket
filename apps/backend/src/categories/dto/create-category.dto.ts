import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/)
  color!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  icon!: string;
}
