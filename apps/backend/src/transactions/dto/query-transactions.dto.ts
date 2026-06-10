import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { TransactionType } from "@prisma/client";

export class QueryTransactionsDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
