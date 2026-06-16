/** Команда удаления транзакции. Диспатчится из `TransactionsController.delete`. */
export class DeleteTransactionCommand {
  /**
   * @param id - UUID удаляемой транзакции
   * @param userId - id владельца (для изоляции)
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
