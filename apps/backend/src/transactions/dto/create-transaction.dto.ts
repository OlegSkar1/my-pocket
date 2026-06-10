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

export class CreateTransactionDto {
  @IsNumberString()
  @IsNotEmpty()
  amount!: string;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsDateString()
  date!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}
