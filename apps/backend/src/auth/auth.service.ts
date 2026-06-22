import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserCommand } from '../users/commands/create-user.command';
import { GetUserByEmailQuery } from '../users/queries/get-user-by-email.query';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from '@my-pocket/shared-types';

/**
 * Сервис аутентификации. Регистрирует пользователей,
 * проверяет учётные данные и выдаёт JWT-токены.
 */
@Injectable()
export class AuthService {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
		private readonly jwtService: JwtService,
	) {}

	/**
	 * Регистрирует нового пользователя: хеширует пароль и создаёт запись через CQRS.
	 * @param dto - имя, email и пароль в открытом виде
	 * @returns JWT-токен и краткий профиль созданного пользователя
	 * @throws {ConflictException} если email уже занят
	 */
	async register(dto: RegisterDto): Promise<AuthResponse> {
		const passwordHash = await bcrypt.hash(dto.password, 10);
		const user: User = await this.commandBus.execute(new CreateUserCommand(dto.name, dto.email, passwordHash));
		return this.buildResponse(user);
	}

	/**
	 * Проверяет учётные данные и выдаёт токен при успехе.
	 * @param dto - email и пароль в открытом виде
	 * @returns JWT-токен и краткий профиль пользователя
	 * @throws {UnauthorizedException} если email не найден или пароль не совпадает
	 */
	async login(dto: LoginDto): Promise<AuthResponse> {
		const user: User | null = await this.queryBus.execute(new GetUserByEmailQuery(dto.email));
		if (!user) {
			throw new UnauthorizedException('Неверный email или пароль');
		}
		const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
		if (!passwordMatch) {
			throw new UnauthorizedException('Неверный email или пароль');
		}
		return this.buildResponse(user);
	}

	/**
	 * Подписывает JWT и собирает ответ `AuthResponse`.
	 * Payload токена: `{ sub: userId, email }`.
	 * @param user - Prisma-запись пользователя
	 * @returns объект `{ accessToken, user }` для отдачи клиенту
	 */
	private buildResponse(user: User): AuthResponse {
		const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });
		return {
			accessToken,
			user: { id: user.id, name: user.name, email: user.email },
		};
	}
}
