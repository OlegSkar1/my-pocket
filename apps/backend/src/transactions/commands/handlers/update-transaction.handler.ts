import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Transaction } from "@prisma/client";
import { UpdateTransactionCommand } from "../update-transaction.command";
import { TransactionsService } from "../../transactions.service";

@CommandHandler(UpdateTransactionCommand)
export class UpdateTransactionHandler
  implements ICommandHandler<UpdateTransactionCommand, Transaction>
{
  constructor(private readonly transactionsService: TransactionsService) {}

  execute(command: UpdateTransactionCommand): Promise<Transaction> {
    return this.transactionsService.update(
      command.id,
      command.userId,
      command.dto,
    );
  }
}
