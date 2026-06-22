import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Сервис категорий. Содержит доменную логику:
 * проверку уникальности имени и ограничения на удаление.
 */
@Injectable()
export class CategoriesService {
	constructor(private readonly repo: CategoriesRepository) {}

	/**
	 * Создаёт категорию для пользователя.
	 * @param userId - id владельца
	 * @param dto - данные новой категории
	 * @returns созданная категория
	 * @throws {ConflictException} если категория с таким именем уже существует (Prisma P2002)
	 */
	async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
		try {
			return await this.repo.create(userId, dto);
		} catch (err) {
			throw this.mapKnownError(err, dto.name);
		}
	}

	/**
	 * Возвращает все категории пользователя.
	 * @param userId - id владельца
	 * @returns массив категорий
	 */
	findManyByUser(userId: string): Promise<Category[]> {
		return this.repo.findManyByUser(userId);
	}

	/**
	 * Ищет категорию по id в скоупе пользователя.
	 * @param id - UUID категории
	 * @param userId - id владельца (гарантирует изоляцию между пользователями)
	 * @returns найденная категория
	 * @throws {NotFoundException} если категория не найдена
	 */
	async findByIdForUser(id: string, userId: string): Promise<Category> {
		const category = await this.repo.findByIdForUser(id, userId);
		if (!category) throw new NotFoundException('Категория не найдена');
		return category;
	}

	/**
	 * Обновляет категорию в скоупе пользователя.
	 * @param id - UUID категории
	 * @param userId - id владельца
	 * @param dto - поля для обновления
	 * @returns обновлённая категория
	 * @throws {NotFoundException} если категория не найдена (Prisma P2025)
	 * @throws {ConflictException} если новое имя уже занято (Prisma P2002)
	 */
	async update(id: string, userId: string, dto: UpdateCategoryDto): Promise<Category> {
		try {
			return await this.repo.update(id, userId, dto);
		} catch (err) {
			throw this.mapKnownError(err, dto.name);
		}
	}

	/**
	 * Удаляет категорию в скоупе пользователя.
	 * Запрещено при наличии связанных транзакций (`onDelete: Restrict`).
	 * @param id - UUID категории
	 * @param userId - id владельца
	 * @throws {NotFoundException} если категория не найдена (Prisma P2025)
	 * @throws {ConflictException} если есть связанные транзакции (Prisma P2003)
	 */
	async delete(id: string, userId: string): Promise<void> {
		try {
			await this.repo.delete(id, userId);
		} catch (err) {
			throw this.mapKnownError(err);
		}
	}

	/**
	 * Отображает известные ошибки Prisma на HTTP-исключения Nest.
	 * @param err - перехваченная ошибка
	 * @param name - имя категории для текста ошибки уникальности (если применимо)
	 * @returns подходящее исключение Nest, иначе исходная ошибка
	 */
	private mapKnownError(err: unknown, name?: string): unknown {
		if (err instanceof Prisma.PrismaClientKnownRequestError) {
			switch (err.code) {
				case 'P2002': // нарушение уникальности (userId, name)
					return new ConflictException(`Категория с именем "${name}" уже существует`);
				case 'P2003': // внешний ключ: есть связанные транзакции (onDelete: Restrict)
					return new ConflictException('Нельзя удалить категорию, пока есть связанные транзакции');
				case 'P2025': // запись не найдена при update/delete
					return new NotFoundException('Категория не найдена');
			}
		}
		return err;
	}
}
