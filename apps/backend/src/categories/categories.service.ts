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
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
				throw new ConflictException(`Категория с именем "${dto.name}" уже существует`);
			}
			throw err;
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
	 * Обновляет категорию. Предварительно проверяет её существование.
	 * @param id - UUID категории
	 * @param userId - id владельца
	 * @param dto - поля для обновления
	 * @returns обновлённая категория
	 * @throws {NotFoundException} если категория не найдена
	 * @throws {ConflictException} если новое имя уже занято (Prisma P2002)
	 */
	async update(id: string, userId: string, dto: UpdateCategoryDto): Promise<Category> {
		await this.findByIdForUser(id, userId);
		try {
			return await this.repo.update(id, userId, dto);
		} catch (err) {
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
				throw new ConflictException(`Категория с именем "${dto.name}" уже существует`);
			}
			throw err;
		}
	}

	/**
	 * Удаляет категорию. Предварительно проверяет её существование.
	 * Запрещено при наличии связанных транзакций (`onDelete: Restrict`).
	 * @param id - UUID категории
	 * @param userId - id владельца
	 * @throws {NotFoundException} если категория не найдена
	 * @throws {ConflictException} если есть связанные транзакции (Prisma P2003)
	 */
	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdForUser(id, userId);
		try {
			await this.repo.delete(id, userId);
		} catch (err) {
			// P2003 — нарушение внешнего ключа: есть связанные транзакции (onDelete: Restrict)
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
				throw new ConflictException('Нельзя удалить категорию, пока есть связанные транзакции');
			}
			throw err;
		}
	}
}
