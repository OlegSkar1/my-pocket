import { QueryTransactionsDto } from "../dto/query-transactions.dto";

export class GetTransactionsQuery {
  constructor(
    public readonly userId: string,
    public readonly filters: QueryTransactionsDto,
  ) {}
}
