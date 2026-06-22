import { UpdateTransactionDto } from '../dto/update-transaction.dto';

/** Команда обновления транзакции. Диспатчится из `TransactionsController.update`. */
export class UpdateTransactionCommand {
	/**
	 * @param id - UUID обновляемой транзакции
	 * @param userId - id владельца (для изоляции)
	 * @param dto - поля для обновления
	 */
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly dto: UpdateTransactionDto,
	) {}
}
