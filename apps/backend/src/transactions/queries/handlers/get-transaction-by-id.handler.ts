import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Transaction } from "@prisma/client";
import { GetTransactionByIdQuery } from "../get-transaction-by-id.query";
import { TransactionsService } from "../../transactions.service";

@QueryHandler(GetTransactionByIdQuery)
export class GetTransactionByIdHandler
  implements IQueryHandler<GetTransactionByIdQuery, Transaction>
{
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Выполняет запрос одной транзакции по id.
   * @param query - запрос с `id` и `userId`
   * @returns найденная транзакция
   * @throws {NotFoundException} если транзакция не найдена
   */
  execute(query: GetTransactionByIdQuery): Promise<Transaction> {
    return this.transactionsService.findByIdForUser(query.id, query.userId);
  }
}
