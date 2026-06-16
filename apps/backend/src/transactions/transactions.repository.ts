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

/**
 * Преобразует строку `"YYYY-MM-DD"` в начало этого дня в UTC.
 * @param dateStr - дата в формате ISO 8601 без времени
 * @returns `Date` для `00:00:00.000 UTC` указанного дня
 */
// "YYYY-MM-DD" → начало этого дня в UTC. Без этого new Date("YYYY-MM-DD")
// уже даёт 00:00 UTC, но мы оборачиваем явно для симметрии с next-day.
function startOfDayUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Преобразует строку `"YYYY-MM-DD"` в начало следующего дня в UTC.
 * Используется как верхняя полуоткрытая граница, чтобы `dateTo` был включительным.
 * @param dateStr - дата в формате ISO 8601 без времени
 * @returns `Date` для `00:00:00.000 UTC` дня, следующего за указанным
 */
// "YYYY-MM-DD" → начало следующего дня в UTC. Используется как верхняя
// полуоткрытая граница, чтобы dateTo был включительным.
function startOfNextDayUtc(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

/**
 * Репозиторий транзакций. Единственное место, где используется `PrismaService`
 * для доступа к таблице `Transaction`.
 */
@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создаёт запись транзакции.
   * @param userId - id владельца
   * @param dto - поля новой транзакции
   * @returns созданная запись
   */
  create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    return this.prisma.transaction.create({ data: { ...dto, userId } });
  }

  /**
   * Возвращает страницу транзакций пользователя с общим счётчиком.
   * Запросы на выборку и count выполняются параллельно.
   * @param userId - id владельца
   * @param filters - критерии фильтрации
   * @param skip - количество записей для пропуска (offset)
   * @param take - максимальное количество записей в ответе
   * @returns объект `{ items, total }`
   */
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

  /**
   * Ищет транзакцию по id в скоупе пользователя.
   * @param id - UUID транзакции
   * @param userId - id владельца (исключает чужие транзакции)
   * @returns транзакция или `null`, если не найдена
   */
  findByIdForUser(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({ where: { id, userId } });
  }

  /**
   * Обновляет поля транзакции. Условие `{ id, userId }` гарантирует изоляцию.
   * @param id - UUID транзакции
   * @param userId - id владельца
   * @param dto - поля для обновления
   * @returns обновлённая транзакция
   */
  update(
    id: string,
    userId: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.prisma.transaction.update({ where: { id, userId }, data: dto });
  }

  /**
   * Удаляет транзакцию. Условие `{ id, userId }` гарантирует изоляцию.
   * @param id - UUID транзакции
   * @param userId - id владельца
   * @returns удалённая запись
   */
  delete(id: string, userId: string): Promise<Transaction> {
    return this.prisma.transaction.delete({ where: { id, userId } });
  }

  /**
   * Агрегирует транзакции по типу (`INCOME` / `EXPENSE`).
   * @param userId - id владельца
   * @param filters - критерии фильтрации
   * @returns массив строк `{ type, _sum.amount, _count._all }`
   */
  groupByType(userId: string, filters: QueryTransactionsDto) {
    return this.prisma.transaction.groupBy({
      by: ["type"],
      where: this.buildWhere(userId, filters),
      _sum: { amount: true },
      _count: { _all: true },
    });
  }

  /**
   * Агрегирует транзакции по паре (категория, тип).
   * @param userId - id владельца
   * @param filters - критерии фильтрации
   * @returns массив строк `{ categoryId, type, _sum.amount, _count._all }`
   */
  groupByCategoryAndType(userId: string, filters: QueryTransactionsDto) {
    return this.prisma.transaction.groupBy({
      by: ["categoryId", "type"],
      where: this.buildWhere(userId, filters),
      _sum: { amount: true },
      _count: { _all: true },
    });
  }

  /**
   * Помесячная агрегация для гистограммы через сырой SQL.
   * Динамический WHERE параметризован через `Prisma.sql`/`Prisma.join` — без `$queryRawUnsafe`.
   * @param userId - id владельца
   * @param filters - критерии фильтрации (тип, категории, диапазон дат)
   * @returns массив строк `{ month, type, sum }`, где `month` усечён до начала месяца UTC
   */
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

  /**
   * Строит объект `Prisma.TransactionWhereInput` на основе фильтров.
   * Даты преобразуются в полуоткрытый интервал UTC: `[dateFrom, dateTo+1)`.
   * @param userId - id владельца (обязательный скоуп)
   * @param filters - параметры фильтрации
   * @returns объект условий для передачи в Prisma-запросы
   */
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
