import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteTransactionCommand } from '../delete-transaction.command';
import { TransactionsService } from '../../transactions.service';

@CommandHandler(DeleteTransactionCommand)
export class DeleteTransactionHandler implements ICommandHandler<DeleteTransactionCommand, void> {
	constructor(private readonly transactionsService: TransactionsService) {}

	/**
	 * Выполняет команду удаления транзакции.
	 * @param command - команда с `id` и `userId`
	 * @throws {NotFoundException} если транзакция не найдена
	 */
	execute(command: DeleteTransactionCommand): Promise<void> {
		return this.transactionsService.delete(command.id, command.userId);
	}
}
