import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** DTO для частичного обновления категории. Все поля опциональны. */
export class UpdateCategoryDto {
	@ApiPropertyOptional({ example: 'Кафе и рестораны', description: 'Новое название (до 50 символов)' })
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	name?: string;

	@ApiPropertyOptional({ example: '#FF5722', description: 'Новый HEX-цвет (#RRGGBB)' })
	@IsOptional()
	@IsString()
	@Matches(/^#([0-9a-fA-F]{6})$/)
	color?: string;

	@ApiPropertyOptional({ example: 'utensils', description: 'Новая иконка (до 64 символов)' })
	@IsOptional()
	@IsString()
	@MaxLength(64)
	icon?: string;
}
