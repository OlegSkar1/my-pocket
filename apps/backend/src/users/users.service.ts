import { ConflictException, Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { UsersRepository } from "./users.repository";

/**
 * Сервис пользователей. Используется только внутри бэкенда
 * (через CQRS-хендлеры из `AuthModule`) — собственного контроллера нет.
 */
@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  /**
   * Ищет пользователя по email.
   * @param email - email для поиска
   * @returns пользователь или `null`, если не найден
   */
  findByEmail(email: string): Promise<User | null> {
    return this.repo.findByEmail(email);
  }

  /**
   * Ищет пользователя по id.
   * @param id - UUID пользователя
   * @returns пользователь или `null`, если не найден
   */
  findById(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }

  /**
   * Создаёт нового пользователя. Предварительно проверяет уникальность email.
   * @param data - имя, email и хеш пароля
   * @returns созданный пользователь
   * @throws {ConflictException} если пользователь с таким email уже существует
   */
  async create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new ConflictException("Пользователь с таким email уже существует");
    }
    return this.repo.create(data);
  }
}
