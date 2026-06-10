import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Transaction } from "@prisma/client";
import { CreateTransactionCommand } from "../create-transaction.command";
import { TransactionsService } from "../../transactions.service";

@CommandHandler(CreateTransactionCommand)
export class CreateTransactionHandler
  implements ICommandHandler<CreateTransactionCommand, Transaction>
{
  constructor(private readonly transactionsService: TransactionsService) {}

  execute(command: CreateTransactionCommand): Promise<Transaction> {
    return this.transactionsService.create(command.userId, command.dto);
  }
}
