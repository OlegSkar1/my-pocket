import { QueryTransactionsDto } from "../dto/query-transactions.dto";

export class GetTransactionsSummaryQuery {
  constructor(
    public readonly userId: string,
    public readonly filters: QueryTransactionsDto,
  ) {}
}
