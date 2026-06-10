import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Transaction } from "@prisma/client";
import { TransactionsSummary } from "@my-pocket/shared-types";
import { TransactionsRepository } from "./transactions.repository";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { QueryTransactionsDto } from "./dto/query-transactions.dto";

@Injectable()
export class TransactionsService {
  constructor(private readonly repo: TransactionsRepository) {}

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    try {
      return await this.repo.create(userId, dto);
    } catch (err) {
      throw this.mapKnownError(err);
    }
  }

  findManyByUser(
    userId: string,
    filters: QueryTransactionsDto,
  ): Promise<Transaction[]> {
    return this.repo.findManyByUser(userId, filters);
  }

  async findByIdForUser(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.repo.findByIdForUser(id, userId);
    if (!transaction) throw new NotFoundException("Транзакция не найдена");
    return transaction;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    await this.findByIdForUser(id, userId);
    try {
      return await this.repo.update(id, userId, dto);
    } catch (err) {
      throw this.mapKnownError(err);
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findByIdForUser(id, userId);
    await this.repo.delete(id, userId);
  }

  async summary(
    userId: string,
    filters: QueryTransactionsDto,
  ): Promise<TransactionsSummary> {
    const [byType, byCategoryType] = await Promise.all([
      this.repo.groupByType(userId, filters),
      this.repo.groupByCategoryAndType(userId, filters),
    ]);

    const zero = new Prisma.Decimal(0);
    const totalIncome =
      byType.find((row) => row.type === "INCOME")?._sum.amount ?? zero;
    const totalExpense =
      byType.find((row) => row.type === "EXPENSE")?._sum.amount ?? zero;

    const categories = new Map<string, { income: Prisma.Decimal; expense: Prisma.Decimal }>();
    for (const row of byCategoryType) {
      const entry =
        categories.get(row.categoryId) ?? { income: zero, expense: zero };
      const amount = row._sum.amount ?? zero;
      if (row.type === "INCOME") entry.income = entry.income.add(amount);
      else entry.expense = entry.expense.add(amount);
      categories.set(row.categoryId, entry);
    }

    return {
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      balance: totalIncome.sub(totalExpense).toFixed(2),
      byCategory: [...categories.entries()].map(([categoryId, sums]) => ({
        categoryId,
        totalIncome: sums.income.toFixed(2),
        totalExpense: sums.expense.toFixed(2),
      })),
    };
  }

  private mapKnownError(err: unknown): unknown {
    // P2003 — нарушение внешнего ключа (несуществующий categoryId)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      return new BadRequestException("Указанная категория не существует");
    }
    return err;
  }
}
