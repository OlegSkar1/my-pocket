import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Transaction } from '@prisma/client';
import { MonthlyStats, PaginatedResult, TransactionsSummary } from '@my-pocket/shared-types';
import { TransactionsRepository } from './transactions.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

/**
 * Сервис транзакций. Содержит доменную логику:
 * пагинацию, агрегации, маппинг ошибок Prisma.
 */
@Injectable()
export class TransactionsService {
	constructor(private readonly repo: TransactionsRepository) {}

	/**
	 * Создаёт транзакцию для пользователя.
	 * @param userId - id владельца транзакции
	 * @param dto - данные новой транзакции
	 * @returns созданная транзакция
	 * @throws {BadRequestException} если `categoryId` не существует (Prisma P2003)
	 */
	async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
		try {
			return await this.repo.create(userId, dto);
		} catch (err) {
			throw this.mapKnownError(err);
		}
	}

	/**
	 * Возвращает постраничный список транзакций пользователя.
	 * @param userId - id владельца
	 * @param filters - параметры фильтрации и пагинации (`page`, `limit`)
	 * @returns объект с массивом транзакций и метаданными (`total`, `page`, `limit`)
	 */
	async findManyByUser(userId: string, filters: QueryTransactionsDto): Promise<PaginatedResult<Transaction>> {
		const page = filters.page ?? 1;
		const limit = filters.limit ?? 10;
		const skip = (page - 1) * limit;
		const { items, total } = await this.repo.findManyByUser(userId, filters, skip, limit);
		return { items, total, page, limit };
	}

	/**
	 * Ищет транзакцию по id в скоупе пользователя.
	 * @param id - UUID транзакции
	 * @param userId - id владельца (гарантирует изоляцию между пользователями)
	 * @returns найденная транзакция
	 * @throws {NotFoundException} если транзакция не найдена
	 */
	async findByIdForUser(id: string, userId: string): Promise<Transaction> {
		const transaction = await this.repo.findByIdForUser(id, userId);
		if (!transaction) throw new NotFoundException('Транзакция не найдена');
		return transaction;
	}

	/**
	 * Обновляет транзакцию в скоупе пользователя.
	 * @param id - UUID транзакции
	 * @param userId - id владельца
	 * @param dto - поля для обновления
	 * @returns обновлённая транзакция
	 * @throws {NotFoundException} если транзакция не найдена (Prisma P2025)
	 * @throws {BadRequestException} если новый `categoryId` не существует (Prisma P2003)
	 */
	async update(id: string, userId: string, dto: UpdateTransactionDto): Promise<Transaction> {
		try {
			return await this.repo.update(id, userId, dto);
		} catch (err) {
			throw this.mapKnownError(err);
		}
	}

	/**
	 * Удаляет транзакцию в скоупе пользователя.
	 * @param id - UUID транзакции
	 * @param userId - id владельца
	 * @throws {NotFoundException} если транзакция не найдена (Prisma P2025)
	 */
	async delete(id: string, userId: string): Promise<void> {
		try {
			await this.repo.delete(id, userId);
		} catch (err) {
			throw this.mapKnownError(err);
		}
	}

	/**
	 * Вычисляет сводку (доходы, расходы, баланс, разбивка по категориям).
	 * Параллельно выполняет агрегацию по типу и по паре (категория, тип).
	 * @param userId - id владельца
	 * @param filters - параметры фильтрации диапазона
	 * @returns `TransactionsSummary` с суммами в строковом представлении `Decimal`
	 */
	async summary(userId: string, filters: QueryTransactionsDto): Promise<TransactionsSummary> {
		const [byType, byCategoryType] = await Promise.all([
			this.repo.groupByType(userId, filters),
			this.repo.groupByCategoryAndType(userId, filters),
		]);

		const zero = new Prisma.Decimal(0);
		const totalIncome = byType.find((row) => row.type === 'INCOME')?._sum.amount ?? zero;
		const totalExpense = byType.find((row) => row.type === 'EXPENSE')?._sum.amount ?? zero;
		const transactionCount = byType.reduce((acc, row) => acc + row._count._all, 0);

		const categories = new Map<string, { income: Prisma.Decimal; expense: Prisma.Decimal; count: number }>();
		for (const row of byCategoryType) {
			const entry = categories.get(row.categoryId) ?? { income: zero, expense: zero, count: 0 };
			const amount = row._sum.amount ?? zero;
			if (row.type === 'INCOME') entry.income = entry.income.add(amount);
			else entry.expense = entry.expense.add(amount);
			entry.count += row._count._all;
			categories.set(row.categoryId, entry);
		}

		return {
			totalIncome: totalIncome.toFixed(2),
			totalExpense: totalExpense.toFixed(2),
			balance: totalIncome.sub(totalExpense).toFixed(2),
			transactionCount,
			// Сортируем по categoryId — порядок ключей Map недетерминирован относительно БД.
			byCategory: [...categories.entries()]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([categoryId, sums]) => ({
					categoryId,
					totalIncome: sums.income.toFixed(2),
					totalExpense: sums.expense.toFixed(2),
					transactionCount: sums.count,
				})),
		};
	}

	/**
	 * Возвращает помесячную статистику. Пустые месяцы диапазона заполняются нулями.
	 * @param userId - id владельца
	 * @param filters - параметры фильтрации; `dateFrom`/`dateTo` используются для развёртки диапазона
	 * @returns массив `{ month, income, expense }`, отсортированный по возрастанию месяца
	 */
	async monthly(userId: string, filters: QueryTransactionsDto): Promise<MonthlyStats> {
		const rows = await this.repo.groupByMonth(userId, filters);
		const zero = new Prisma.Decimal(0);
		const map = new Map<string, { income: Prisma.Decimal; expense: Prisma.Decimal }>();

		for (const row of rows) {
			const key = this.monthKey(row.month);
			const entry = map.get(key) ?? { income: zero, expense: zero };
			const amount = new Prisma.Decimal(row.sum ?? 0);
			if (row.type === 'INCOME') entry.income = entry.income.add(amount);
			else entry.expense = entry.expense.add(amount);
			map.set(key, entry);
		}

		return this.monthRange(filters, [...map.keys()]).map((month) => {
			const entry = map.get(month);
			return {
				month,
				income: (entry?.income ?? zero).toFixed(2),
				expense: (entry?.expense ?? zero).toFixed(2),
			};
		});
	}

	/**
	 * Форматирует дату в ключ `"YYYY-MM"` в UTC.
	 * @param date - дата из результата БД (усечённая до начала месяца)
	 * @returns строка вида `"2024-03"`
	 */
	// Ключ "YYYY-MM" в UTC.
	private monthKey(date: Date): string {
		const year = date.getUTCFullYear();
		const month = String(date.getUTCMonth() + 1).padStart(2, '0');
		return `${year}-${month}`;
	}

	/**
	 * Возвращает все месяцы диапазона `dateFrom`→`dateTo` включительно.
	 * Если диапазон не задан — только месяцы, присутствующие в данных.
	 * Используется для заполнения нулями отсутствующих месяцев на гистограмме.
	 * @param filters - содержит `dateFrom` и `dateTo` в формате `"YYYY-MM-DD"`
	 * @param dataKeys - ключи `"YYYY-MM"`, фактически присутствующие в данных
	 * @returns упорядоченный массив ключей месяцев
	 */
	// Все месяцы диапазона dateFrom→dateTo (включительно) для заполнения нулями.
	// Если диапазон не задан — только месяцы, присутствующие в данных.
	private monthRange(filters: QueryTransactionsDto, dataKeys: string[]): string[] {
		if (!filters.dateFrom || !filters.dateTo) {
			return [...dataKeys].sort();
		}

		const start = new Date(filters.dateFrom);
		const end = new Date(filters.dateTo);
		const result: string[] = [];
		let year = start.getUTCFullYear();
		let month = start.getUTCMonth();
		const endYear = end.getUTCFullYear();
		const endMonth = end.getUTCMonth();

		while (year < endYear || (year === endYear && month <= endMonth)) {
			result.push(`${year}-${String(month + 1).padStart(2, '0')}`);
			month += 1;
			if (month > 11) {
				month = 0;
				year += 1;
			}
		}
		return result;
	}

	/**
	 * Отображает известные ошибки Prisma на HTTP-исключения Nest.
	 * @param err - перехваченная ошибка
	 * @returns подходящее исключение Nest, иначе исходная ошибка
	 */
	private mapKnownError(err: unknown): unknown {
		if (err instanceof Prisma.PrismaClientKnownRequestError) {
			switch (err.code) {
				case 'P2003': // внешний ключ: несуществующий categoryId
					return new BadRequestException('Указанная категория не существует');
				case 'P2025': // запись не найдена при update/delete
					return new NotFoundException('Транзакция не найдена');
			}
		}
		return err;
	}
}
