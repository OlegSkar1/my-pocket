import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Category } from "@prisma/client";
import { GetCategoryByIdQuery } from "../get-category-by-id.query";
import { CategoriesService } from "../../categories.service";

@QueryHandler(GetCategoryByIdQuery)
export class GetCategoryByIdHandler
  implements IQueryHandler<GetCategoryByIdQuery, Category>
{
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Выполняет запрос одной категории по id.
   * @param query - запрос с `id` и `userId`
   * @returns найденная категория
   * @throws {NotFoundException} если категория не найдена
   */
  execute(query: GetCategoryByIdQuery): Promise<Category> {
    return this.categoriesService.findByIdForUser(query.id, query.userId);
  }
}
