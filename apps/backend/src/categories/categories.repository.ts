import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Репозиторий категорий. Единственное место, где используется `PrismaService`
 * для доступа к таблице `Category`.
 */
@Injectable()
export class CategoriesRepository {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Создаёт запись категории.
	 * @param userId - id владельца
	 * @param dto - поля новой категории
	 * @returns созданная запись
	 */
	create(userId: string, dto: CreateCategoryDto): Promise<Category> {
		return this.prisma.category.create({ data: { ...dto, userId } });
	}

	/**
	 * Возвращает все категории пользователя.
	 * @param userId - id владельца
	 * @returns массив категорий
	 */
	findManyByUser(userId: string): Promise<Category[]> {
		return this.prisma.category.findMany({ where: { userId } });
	}

	/**
	 * Ищет категорию по id в скоупе пользователя.
	 * @param id - UUID категории
	 * @param userId - id владельца (исключает чужие категории)
	 * @returns категория или `null`, если не найдена
	 */
	findByIdForUser(id: string, userId: string): Promise<Category | null> {
		return this.prisma.category.findFirst({ where: { id, userId } });
	}

	/**
	 * Обновляет поля категории. Условие `{ id, userId }` гарантирует изоляцию.
	 * @param id - UUID категории
	 * @param userId - id владельца
	 * @param dto - поля для обновления
	 * @returns обновлённая категория
	 */
	update(id: string, userId: string, dto: UpdateCategoryDto): Promise<Category> {
		return this.prisma.category.update({ where: { id, userId }, data: dto });
	}

	/**
	 * Удаляет категорию. Условие `{ id, userId }` гарантирует изоляцию.
	 * Бросит ошибку Prisma P2003, если есть связанные транзакции.
	 * @param id - UUID категории
	 * @param userId - id владельца
	 * @returns удалённая запись
	 */
	delete(id: string, userId: string): Promise<Category> {
		return this.prisma.category.delete({ where: { id, userId } });
	}
}
