import { CreateTransactionDto } from "../dto/create-transaction.dto";

/** Команда создания транзакции. Диспатчится из `TransactionsController.create`. */
export class CreateTransactionCommand {
  /**
   * @param userId - id владельца транзакции
   * @param dto - данные новой транзакции
   */
  constructor(
    public readonly userId: string,
    public readonly dto: CreateTransactionDto,
  ) {}
}
