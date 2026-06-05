import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Category } from "@prisma/client";
import { UpdateCategoryCommand } from "../update-category.command";
import { CategoriesService } from "../../categories.service";

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler
  implements ICommandHandler<UpdateCategoryCommand, Category>
{
  constructor(private readonly categoriesService: CategoriesService) {}

  execute(command: UpdateCategoryCommand): Promise<Category> {
    return this.categoriesService.update(command.id, command.userId, command.dto);
  }
}
