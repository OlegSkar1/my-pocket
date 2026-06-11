import { QueryTransactionsDto } from "../dto/query-transactions.dto";

export class GetMonthlyStatsQuery {
  constructor(
    public readonly userId: string,
    public readonly filters: QueryTransactionsDto,
  ) {}
}
