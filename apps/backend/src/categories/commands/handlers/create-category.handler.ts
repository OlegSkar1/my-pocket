import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Category } from "@prisma/client";
import { CreateCategoryCommand } from "../create-category.command";
import { CategoriesService } from "../../categories.service";

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler
  implements ICommandHandler<CreateCategoryCommand, Category>
{
  constructor(private readonly categoriesService: CategoriesService) {}

  execute(command: CreateCategoryCommand): Promise<Category> {
    return this.categoriesService.create(command.userId, command.dto);
  }
}
