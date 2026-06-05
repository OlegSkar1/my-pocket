import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CategoriesRepository } from "./categories.repository";
import { CategoriesService } from "./categories.service";
import { CategoriesController } from "./categories.controller";
import { CreateCategoryHandler } from "./commands/handlers/create-category.handler";
import { UpdateCategoryHandler } from "./commands/handlers/update-category.handler";
import { DeleteCategoryHandler } from "./commands/handlers/delete-category.handler";
import { GetCategoriesHandler } from "./queries/handlers/get-categories.handler";
import { GetCategoryByIdHandler } from "./queries/handlers/get-category-by-id.handler";

const CommandHandlers = [
  CreateCategoryHandler,
  UpdateCategoryHandler,
  DeleteCategoryHandler,
];
const QueryHandlers = [GetCategoriesHandler, GetCategoryByIdHandler];

@Module({
  imports: [CqrsModule],
  controllers: [CategoriesController],
  providers: [
    CategoriesRepository,
    CategoriesService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class CategoriesModule {}
