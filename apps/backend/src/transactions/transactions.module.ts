import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TransactionsRepository } from "./transactions.repository";
import { TransactionsService } from "./transactions.service";
import { TransactionsController } from "./transactions.controller";
import { CreateTransactionHandler } from "./commands/handlers/create-transaction.handler";
import { UpdateTransactionHandler } from "./commands/handlers/update-transaction.handler";
import { DeleteTransactionHandler } from "./commands/handlers/delete-transaction.handler";
import { GetTransactionsHandler } from "./queries/handlers/get-transactions.handler";
import { GetTransactionByIdHandler } from "./queries/handlers/get-transaction-by-id.handler";
import { GetTransactionsSummaryHandler } from "./queries/handlers/get-transactions-summary.handler";

const CommandHandlers = [
  CreateTransactionHandler,
  UpdateTransactionHandler,
  DeleteTransactionHandler,
];
const QueryHandlers = [
  GetTransactionsHandler,
  GetTransactionByIdHandler,
  GetTransactionsSummaryHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsRepository,
    TransactionsService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class TransactionsModule {}
