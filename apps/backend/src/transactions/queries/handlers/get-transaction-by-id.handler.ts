import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Transaction } from "@prisma/client";
import { GetTransactionByIdQuery } from "../get-transaction-by-id.query";
import { TransactionsService } from "../../transactions.service";

@QueryHandler(GetTransactionByIdQuery)
export class GetTransactionByIdHandler
  implements IQueryHandler<GetTransactionByIdQuery, Transaction>
{
  constructor(private readonly transactionsService: TransactionsService) {}

  execute(query: GetTransactionByIdQuery): Promise<Transaction> {
    return this.transactionsService.findByIdForUser(query.id, query.userId);
  }
}
