import { Injectable } from "@nestjs/common";
import { Prisma, Transaction } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { QueryTransactionsDto } from "./dto/query-transactions.dto";

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    return this.prisma.transaction.create({ data: { ...dto, userId } });
  }

  findManyByUser(
    userId: string,
    filters: QueryTransactionsDto,
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: this.buildWhere(userId, filters),
      orderBy: { date: "desc" },
    });
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
    });
  }

  groupByCategoryAndType(userId: string, filters: QueryTransactionsDto) {
    return this.prisma.transaction.groupBy({
      by: ["categoryId", "type"],
      where: this.buildWhere(userId, filters),
      _sum: { amount: true },
    });
  }

  private buildWhere(
    userId: string,
    filters: QueryTransactionsDto,
  ): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = { userId };

    if (filters.type) where.type = filters.type;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }

    return where;
  }
}
