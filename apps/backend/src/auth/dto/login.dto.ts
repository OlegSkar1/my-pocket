import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** DTO для входа в систему. */
export class LoginDto {
	@ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
	@IsEmail()
	email!: string;

	@ApiProperty({ example: 'secret123', description: 'Пароль пользователя' })
	@IsString()
	password!: string;
}
