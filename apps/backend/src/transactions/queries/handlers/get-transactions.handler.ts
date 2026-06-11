import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Transaction } from "@prisma/client";
import { PaginatedResult } from "@my-pocket/shared-types";
import { GetTransactionsQuery } from "../get-transactions.query";
import { TransactionsService } from "../../transactions.service";

@QueryHandler(GetTransactionsQuery)
export class GetTransactionsHandler
  implements IQueryHandler<GetTransactionsQuery, PaginatedResult<Transaction>>
{
  constructor(private readonly transactionsService: TransactionsService) {}

  execute(query: GetTransactionsQuery): Promise<PaginatedResult<Transaction>> {
    return this.transactionsService.findManyByUser(query.userId, query.filters);
  }
}
