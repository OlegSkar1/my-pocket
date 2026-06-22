/** Запрос одной транзакции по UUID в скоупе пользователя. */
export class GetTransactionByIdQuery {
	/**
	 * @param id - UUID транзакции
	 * @param userId - id владельца (для изоляции)
	 */
	constructor(
		public readonly id: string,
		public readonly userId: string,
	) {}
}
