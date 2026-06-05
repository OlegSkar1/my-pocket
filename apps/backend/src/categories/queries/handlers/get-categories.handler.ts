import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Category } from "@prisma/client";
import { GetCategoriesQuery } from "../get-categories.query";
import { CategoriesService } from "../../categories.service";

@QueryHandler(GetCategoriesQuery)
export class GetCategoriesHandler
  implements IQueryHandler<GetCategoriesQuery, Category[]>
{
  constructor(private readonly categoriesService: CategoriesService) {}

  execute(query: GetCategoriesQuery): Promise<Category[]> {
    return this.categoriesService.findManyByUser(query.userId);
  }
}
