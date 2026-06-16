import { QueryTransactionsDto } from "../dto/query-transactions.dto";

/** Запрос агрегированной сводки (доходы, расходы, баланс, разбивка по категориям). */
export class GetTransactionsSummaryQuery {
  /**
   * @param userId - id владельца
   * @param filters - параметры фильтрации диапазона
   */
  constructor(
    public readonly userId: string,
    public readonly filters: QueryTransactionsDto,
  ) {}
}
