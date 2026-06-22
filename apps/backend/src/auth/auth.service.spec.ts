import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { CreateUserCommand } from '../users/commands/create-user.command';
import { GetUserByEmailQuery } from '../users/queries/get-user-by-email.query';

jest.mock('bcrypt', () => ({
	hash: jest.fn(),
	compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

const bcryptHash = bcrypt.hash as jest.Mock;
const bcryptCompare = bcrypt.compare as jest.Mock;

const USER_FIXTURE: User = {
	id: '00000000-0000-0000-0000-000000000001',
	name: 'Тестовый Пользователь',
	email: 'test@example.com',
	passwordHash: '$2b$10$hashedpassword',
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01'),
};

describe('AuthService', () => {
	let service: AuthService;
	let commandBus: jest.Mocked<CommandBus>;
	let queryBus: jest.Mocked<QueryBus>;
	let jwtService: jest.Mocked<JwtService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: CommandBus, useValue: { execute: jest.fn() } },
				{ provide: QueryBus, useValue: { execute: jest.fn() } },
				{ provide: JwtService, useValue: { sign: jest.fn() } },
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		commandBus = module.get(CommandBus) as jest.Mocked<CommandBus>;
		queryBus = module.get(QueryBus) as jest.Mocked<QueryBus>;
		jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('register', () => {
		it('должен захешировать пароль, диспатчить CreateUserCommand и вернуть AuthResponse', async () => {
			const dto = { name: 'Тестовый Пользователь', email: 'test@example.com', password: 'password123' };
			bcryptHash.mockResolvedValue('$2b$10$hashedpassword');
			commandBus.execute.mockResolvedValue(USER_FIXTURE);
			jwtService.sign.mockReturnValue('access-token');

			const result = await service.register(dto);

			expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
			expect(commandBus.execute).toHaveBeenCalledWith(
				new CreateUserCommand('Тестовый Пользователь', 'test@example.com', '$2b$10$hashedpassword'),
			);
			expect(jwtService.sign).toHaveBeenCalledWith({
				sub: USER_FIXTURE.id,
				email: USER_FIXTURE.email,
			});
			expect(result).toEqual({
				accessToken: 'access-token',
				user: { id: USER_FIXTURE.id, name: USER_FIXTURE.name, email: USER_FIXTURE.email },
			});
		});

		it('должен пробросить ConflictException если email уже занят', async () => {
			bcryptHash.mockResolvedValue('$2b$10$hashedpassword');
			commandBus.execute.mockRejectedValue(new ConflictException('Пользователь с таким email уже существует'));

			await expect(
				service.register({ name: 'Тест', email: 'test@example.com', password: 'password123' }),
			).rejects.toThrow(ConflictException);
		});
	});

	describe('login', () => {
		it('должен вернуть AuthResponse при корректных учётных данных', async () => {
			const dto = { email: 'test@example.com', password: 'password123' };
			queryBus.execute.mockResolvedValue(USER_FIXTURE);
			bcryptCompare.mockResolvedValue(true);
			jwtService.sign.mockReturnValue('access-token');

			const result = await service.login(dto);

			expect(queryBus.execute).toHaveBeenCalledWith(new GetUserByEmailQuery('test@example.com'));
			expect(bcrypt.compare).toHaveBeenCalledWith('password123', USER_FIXTURE.passwordHash);
			expect(result).toEqual({
				accessToken: 'access-token',
				user: { id: USER_FIXTURE.id, name: USER_FIXTURE.name, email: USER_FIXTURE.email },
			});
		});

		it('должен бросить UnauthorizedException если пользователь не найден', async () => {
			queryBus.execute.mockResolvedValue(null);

			await expect(service.login({ email: 'unknown@example.com', password: 'password123' })).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('должен бросить UnauthorizedException если пароль не совпадает', async () => {
			queryBus.execute.mockResolvedValue(USER_FIXTURE);
			bcryptCompare.mockResolvedValue(false);

			await expect(service.login({ email: 'test@example.com', password: 'wrongpassword' })).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('должен бросить одинаковое сообщение для несуществующего email и неверного пароля', async () => {
			queryBus.execute.mockResolvedValue(null);

			const error = await service.login({ email: 'no@example.com', password: 'any' }).catch((e) => e);

			expect(error).toBeInstanceOf(UnauthorizedException);
			expect(error.message).toBe('Неверный email или пароль');
		});
	});
});
