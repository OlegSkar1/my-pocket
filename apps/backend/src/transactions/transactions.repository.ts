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

// "YYYY-MM-DD" → начало этого дня в UTC. Без этого new Date("YYYY-MM-DD")
// уже даёт 00:00 UTC, но мы оборачиваем явно для симметрии с next-day.
function startOfDayUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

// "YYYY-MM-DD" → начало следующего дня в UTC. Используется как верхняя
// полуоткрытая граница, чтобы dateTo был включительным.
function startOfNextDayUtc(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
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
    const [items, total] = await Promise.all([
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
    }
    if (filters.dateFrom) {
      conditions.push(Prisma.sql`"date" >= ${startOfDayUtc(filters.dateFrom)}`);
    }
    if (filters.dateTo) {
      conditions.push(Prisma.sql`"date" < ${startOfNextDayUtc(filters.dateTo)}`);
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
    }

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = startOfDayUtc(filters.dateFrom);
      // Полуоткрытый интервал: < начало следующего дня — чтобы dateTo был включительным.
      if (filters.dateTo) where.date.lt = startOfNextDayUtc(filters.dateTo);
    }

    return where;
  }
}
