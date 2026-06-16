import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Category } from "@prisma/client";
import { UpdateCategoryCommand } from "../update-category.command";
import { CategoriesService } from "../../categories.service";

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler
  implements ICommandHandler<UpdateCategoryCommand, Category>
{
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Выполняет команду обновления категории.
   * @param command - команда с `id`, `userId` и `dto`
   * @returns обновлённая категория
   * @throws {NotFoundException} если категория не найдена
   * @throws {ConflictException} если новое имя уже занято
   */
  execute(command: UpdateCategoryCommand): Promise<Category> {
    return this.categoriesService.update(command.id, command.userId, command.dto);
  }
}
