import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { DeleteCategoryCommand } from "../delete-category.command";
import { CategoriesService } from "../../categories.service";

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand, void> {
  constructor(private readonly categoriesService: CategoriesService) {}

  execute(command: DeleteCategoryCommand): Promise<void> {
    return this.categoriesService.delete(command.id, command.userId);
  }
}
