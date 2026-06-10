import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { TransactionType } from "@prisma/client";

export class UpdateTransactionDto {
  @IsOptional()
  @IsNumberString()
  @IsNotEmpty()
  amount?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;
}
