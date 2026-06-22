import { IsDateString, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

/** DTO для создания транзакции. Все поля обязательны, кроме `description`. */
export class CreateTransactionDto {
	@ApiProperty({
		example: '1500.00',
		description: 'Сумма транзакции (строка, Decimal 12,2)',
	})
	@IsNumberString()
	@IsNotEmpty()
	amount!: string;

	@ApiProperty({
		enum: TransactionType,
		example: TransactionType.EXPENSE,
		description: 'Тип транзакции',
	})
	@IsEnum(TransactionType)
	type!: TransactionType;

	@ApiProperty({
		example: 'Обед в кафе',
		description: 'Описание (до 255 символов)',
		required: false,
		nullable: true,
	})
	@IsOptional()
	@IsString()
	@MaxLength(255)
	description?: string;

	@ApiProperty({
		example: '2024-06-15',
		description: 'Дата транзакции в формате YYYY-MM-DD',
	})
	@IsDateString()
	date!: string;

	@ApiProperty({
		example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
		description: 'UUID категории',
	})
	@IsString()
	@IsNotEmpty()
	categoryId!: string;
}
