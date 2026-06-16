import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { TransactionType } from "@prisma/client";

/** DTO для фильтрации и пагинации списка транзакций (query-string). */
export class QueryTransactionsDto {
  @ApiPropertyOptional({
    example: "2024-01-01",
    description: "Начало диапазона дат (включительно), формат YYYY-MM-DD",
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: "2024-06-30",
    description: "Конец диапазона дат (включительно), формат YYYY-MM-DD",
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
    description: "Фильтр по типу транзакции",
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({
    type: [String],
    example: ["b2c3d4e5-f6a7-8901-bcde-f12345678901"],
    description: "Фильтр по категориям (UUID v4). Одиночное значение нормализуется в массив.",
  })
  // Мультивыбор категорий. Одиночное значение нормализуем в массив.
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : Array.isArray(value) ? value : [value],
  )
  @IsArray()
  @IsUUID("4", { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ example: 1, description: "Номер страницы (от 1)", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: "Размер страницы (1–100)", default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
