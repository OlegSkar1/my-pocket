import { UpdateTransactionDto } from "../dto/update-transaction.dto";

export class UpdateTransactionCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly dto: UpdateTransactionDto,
  ) {}
}
