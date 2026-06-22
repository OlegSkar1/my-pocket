import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Category } from '@prisma/client';
import { GetCategoriesQuery } from '../get-categories.query';
import { CategoriesService } from '../../categories.service';

@QueryHandler(GetCategoriesQuery)
export class GetCategoriesHandler implements IQueryHandler<GetCategoriesQuery, Category[]> {
	constructor(private readonly categoriesService: CategoriesService) {}

	/**
	 * Выполняет запрос списка категорий пользователя.
	 * @param query - запрос с `userId`
	 * @returns массив категорий
	 */
	execute(query: GetCategoriesQuery): Promise<Category[]> {
		return this.categoriesService.findManyByUser(query.userId);
	}
}
