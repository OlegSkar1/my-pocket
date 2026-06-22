import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCategoryCommand } from '../delete-category.command';
import { CategoriesService } from '../../categories.service';

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand, void> {
	constructor(private readonly categoriesService: CategoriesService) {}

	/**
	 * Выполняет команду удаления категории.
	 * @param command - команда с `id` и `userId`
	 * @throws {NotFoundException} если категория не найдена
	 * @throws {ConflictException} если есть связанные транзакции
	 */
	execute(command: DeleteCategoryCommand): Promise<void> {
		return this.categoriesService.delete(command.id, command.userId);
	}
}
