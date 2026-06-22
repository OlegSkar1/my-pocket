import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

/**
 * Репозиторий пользователей. Единственное место, где используется `PrismaService`
 * для доступа к таблице `User`.
 */
@Injectable()
export class UsersRepository {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Ищет пользователя по уникальному email.
	 * @param email - email для поиска
	 * @returns пользователь или `null`, если не найден
	 */
	findByEmail(email: string): Promise<User | null> {
		return this.prisma.user.findUnique({ where: { email } });
	}

	/**
	 * Ищет пользователя по уникальному id.
	 * @param id - UUID пользователя
	 * @returns пользователь или `null`, если не найден
	 */
	findById(id: string): Promise<User | null> {
		return this.prisma.user.findUnique({ where: { id } });
	}

	/**
	 * Создаёт запись пользователя.
	 * @param data - имя, email и хеш пароля
	 * @returns созданный пользователь
	 */
	create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
		return this.prisma.user.create({ data });
	}
}
