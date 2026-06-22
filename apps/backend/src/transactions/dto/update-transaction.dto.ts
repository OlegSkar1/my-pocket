import { IsDateString, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

/** DTO для частичного обновления транзакции. Все поля опциональны. */
export class UpdateTransactionDto {
	@ApiPropertyOptional({
		example: '2000.00',
		description: 'Сумма транзакции (строка, Decimal 12,2)',
	})
	@IsOptional()
	@IsNumberString()
	@IsNotEmpty()
	amount?: string;

	@ApiPropertyOptional({
		enum: TransactionType,
		example: TransactionType.INCOME,
		description: 'Тип транзакции',
	})
	@IsOptional()
	@IsEnum(TransactionType)
	type?: TransactionType;

	@ApiPropertyOptional({
		example: 'Зарплата за июнь',
		description: 'Описание (до 255 символов)',
		nullable: true,
	})
	@IsOptional()
	@IsString()
	@MaxLength(255)
	description?: string;

	@ApiPropertyOptional({
		example: '2024-06-20',
		description: 'Дата транзакции в формате YYYY-MM-DD',
	})
	@IsOptional()
	@IsDateString()
	date?: string;

	@ApiPropertyOptional({
		example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
		description: 'UUID категории',
	})
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	categoryId?: string;
}
