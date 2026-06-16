import { QueryTransactionsDto } from "../dto/query-transactions.dto";

/** Запрос помесячной статистики доходов и расходов. */
export class GetMonthlyStatsQuery {
  /**
   * @param userId - id владельца
   * @param filters - параметры фильтрации; `dateFrom`/`dateTo` задают диапазон для заполнения нулями
   */
  constructor(
    public readonly userId: string,
    public readonly filters: QueryTransactionsDto,
  ) {}
}
