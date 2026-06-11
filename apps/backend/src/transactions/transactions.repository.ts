import { Injectable } from "@nestjs/common";
import { Prisma, Transaction, TransactionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { QueryTransactionsDto } from "./dto/query-transactions.dto";

interface MonthlyRow {
  month: Date;
  type: TransactionType;
  sum: Prisma.Decimal;
}

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    return this.prisma.transaction.create({ data: { ...dto, userId } });
  }

  async findManyByUser(
    userId: string,
    filters: QueryTransactionsDto,
    skip: number,
    take: number,
  ): Promise<{ items: Transaction[]; total: number }> {
    const where = this.buildWhere(userId, filters);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, total };
  }

  findByIdForUser(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({ where: { id, userId } });
  }

  update(
    id: string,
    userId: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.prisma.transaction.update({ where: { id, userId }, data: dto });
  }

  delete(id: string, userId: string): Promise<Transaction> {
    return this.prisma.transaction.delete({ where: { id, userId } });
  }

  groupByType(userId: string, filters: QueryTransactionsDto) {
    return this.prisma.transaction.groupBy({
      by: ["type"],
      where: this.buildWhere(userId, filters),
      _sum: { amount: true },
      _count: { _all: true },
    });
  }

  groupByCategoryAndType(userId: string, filters: QueryTransactionsDto) {
    return this.prisma.transaction.groupBy({
      by: ["categoryId", "type"],
      where: this.buildWhere(userId, filters),
      _sum: { amount: true },
      _count: { _all: true },
    });
  }

  // Помесячная агрегация для гистограммы. Динамический WHERE параметризован
  // через Prisma.sql/Prisma.join — без $queryRawUnsafe.
  groupByMonth(
    userId: string,
    filters: QueryTransactionsDto,
  ): Promise<MonthlyRow[]> {
    const conditions: Prisma.Sql[] = [Prisma.sql`"userId" = ${userId}`];

    if (filters.type) {
      conditions.push(Prisma.sql`"type"::text = ${filters.type}`);
    }
    if (filters.categoryIds?.length) {
      conditions.push(
        Prisma.sql`"categoryId" IN (${Prisma.join(filters.categoryIds)})`,
      );
    } else if (filters.categoryId) {
      conditions.push(Prisma.sql`"categoryId" = ${filters.categoryId}`);
    }
    if (filters.dateFrom) {
      conditions.push(Prisma.sql`"date" >= ${new Date(filters.dateFrom)}`);
    }
    if (filters.dateTo) {
      conditions.push(Prisma.sql`"date" <= ${new Date(filters.dateTo)}`);
    }

    return this.prisma.$queryRaw<MonthlyRow[]>(Prisma.sql`
      SELECT date_trunc('month', "date" AT TIME ZONE 'UTC') AS month,
             "type",
             SUM("amount") AS sum
      FROM "Transaction"
      WHERE ${Prisma.join(conditions, " AND ")}
      GROUP BY month, "type"
    `);
  }

  private buildWhere(
    userId: string,
    filters: QueryTransactionsDto,
  ): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = { userId };

    if (filters.type) where.type = filters.type;
    if (filters.categoryIds?.length) {
      where.categoryId = { in: filters.categoryIds };
    } else if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }

    return where;
  }
}
