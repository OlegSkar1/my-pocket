import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** DTO для создания категории. */
export class CreateCategoryDto {
	@ApiProperty({ example: 'Продукты', description: 'Название категории (до 50 символов)' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	name!: string;

	@ApiProperty({ example: '#4CAF50', description: 'HEX-цвет категории (#RRGGBB)' })
	@IsString()
	@Matches(/^#([0-9a-fA-F]{6})$/)
	color!: string;

	@ApiProperty({ example: 'shopping-cart', description: 'Иконка категории (до 64 символов)' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(64)
	icon!: string;
}
