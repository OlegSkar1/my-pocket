import { QueryTransactionsDto } from "../dto/query-transactions.dto";

/** Запрос постраничного списка транзакций пользователя. */
export class GetTransactionsQuery {
  /**
   * @param userId - id владельца
   * @param filters - параметры фильтрации и пагинации
   */
  constructor(
    public readonly userId: string,
    public readonly filters: QueryTransactionsDto,
  ) {}
}
