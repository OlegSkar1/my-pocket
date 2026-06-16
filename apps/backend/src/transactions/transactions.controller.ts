import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { Transaction } from "@prisma/client";
import {
  MonthlyStats,
  PaginatedResult,
  TransactionsSummary,
} from "@my-pocket/shared-types";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { QueryTransactionsDto } from "./dto/query-transactions.dto";
import { CreateTransactionCommand } from "./commands/create-transaction.command";
import { UpdateTransactionCommand } from "./commands/update-transaction.command";
import { DeleteTransactionCommand } from "./commands/delete-transaction.command";
import { GetTransactionsQuery } from "./queries/get-transactions.query";
import { GetTransactionByIdQuery } from "./queries/get-transaction-by-id.query";
import { GetTransactionsSummaryQuery } from "./queries/get-transactions-summary.query";
import { GetMonthlyStatsQuery } from "./queries/get-monthly-stats.query";

const TRANSACTION_EXAMPLE = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  amount: "1500.00",
  type: "EXPENSE",
  description: "Обед в кафе",
  date: "2024-06-15T00:00:00.000Z",
  categoryId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  userId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
  createdAt: "2024-06-15T12:00:00.000Z",
  updatedAt: "2024-06-15T12:00:00.000Z",
};

/**
 * Контроллер транзакций (`/transactions`).
 * Все маршруты защищены JWT-аутентификацией.
 * Делегирует обработку на CQRS-шины без бизнес-логики.
 */
@ApiTags("transactions")
@ApiBearerAuth()
@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * `POST /transactions` — создаёт транзакцию.
   * @param userId - id аутентифицированного пользователя из JWT
   * @param dto - данные новой транзакции
   * @returns созданная запись `Transaction`
   * @throws {BadRequestException} если `categoryId` не существует
   */
  @ApiOperation({ summary: "Создать транзакцию" })
  @ApiResponse({
    status: 201,
    description: "Транзакция создана",
    schema: { example: TRANSACTION_EXAMPLE },
  })
  @ApiResponse({
    status: 400,
    description: "Невалидные данные или несуществующая категория",
    schema: {
      example: { statusCode: 400, message: "Указанная категория не существует", error: "Bad Request" },
    },
  })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @Post()
  create(
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateTransactionDto,
  ): Promise<Transaction> {
    return this.commandBus.execute(new CreateTransactionCommand(userId, dto));
  }

  /**
   * `GET /transactions` — постраничный список транзакций пользователя.
   * @param userId - id аутентифицированного пользователя из JWT
   * @param filters - параметры фильтрации и пагинации
   * @returns страница транзакций с метаданными пагинации
   */
  @ApiOperation({ summary: "Получить список транзакций" })
  @ApiResponse({
    status: 200,
    description: "Постраничный список транзакций",
    schema: {
      example: {
        items: [TRANSACTION_EXAMPLE],
        total: 42,
        page: 1,
        limit: 10,
      },
    },
  })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @Get()
  findAll(
    @CurrentUser("userId") userId: string,
    @Query() filters: QueryTransactionsDto,
  ): Promise<PaginatedResult<Transaction>> {
    return this.queryBus.execute(new GetTransactionsQuery(userId, filters));
  }

  /**
   * `GET /transactions/summary` — агрегированная сводка по транзакциям.
   * Объявлен до `/:id`, иначе строка "summary" попадёт в параметр id.
   * @param userId - id аутентифицированного пользователя из JWT
   * @param filters - параметры фильтрации диапазона и типов
   * @returns суммы доходов, расходов, баланс и разбивка по категориям
   */
  @ApiOperation({ summary: "Получить сводку доходов и расходов" })
  @ApiResponse({
    status: 200,
    description: "Суммы доходов, расходов, баланс и разбивка по категориям",
    schema: {
      example: {
        totalIncome: "50000.00",
        totalExpense: "32500.00",
        balance: "17500.00",
        transactionCount: 15,
        byCategory: [
          {
            categoryId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            totalIncome: "0.00",
            totalExpense: "12000.00",
            transactionCount: 5,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  // Должен идти ДО ":id", иначе "summary" попадёт в параметр id.
  @Get("summary")
  summary(
    @CurrentUser("userId") userId: string,
    @Query() filters: QueryTransactionsDto,
  ): Promise<TransactionsSummary> {
    return this.queryBus.execute(
      new GetTransactionsSummaryQuery(userId, filters),
    );
  }

  /**
   * `GET /transactions/monthly` — помесячная статистика доходов и расходов.
   * Объявлен до `/:id`, иначе строка "monthly" попадёт в параметр id.
   * @param userId - id аутентифицированного пользователя из JWT
   * @param filters - параметры фильтрации; `dateFrom`/`dateTo` используются для заполнения нулями
   * @returns массив `{ month, income, expense }` за каждый месяц диапазона
   */
  @ApiOperation({ summary: "Получить помесячную статистику" })
  @ApiResponse({
    status: 200,
    description: "Массив { month, income, expense } за каждый месяц диапазона",
    schema: {
      example: [
        { month: "2024-04", income: "50000.00", expense: "32500.00" },
        { month: "2024-05", income: "50000.00", expense: "28000.00" },
        { month: "2024-06", income: "0.00", expense: "12000.00" },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  // Должен идти ДО ":id", иначе "monthly" попадёт в параметр id.
  @Get("monthly")
  monthly(
    @CurrentUser("userId") userId: string,
    @Query() filters: QueryTransactionsDto,
  ): Promise<MonthlyStats> {
    return this.queryBus.execute(new GetMonthlyStatsQuery(userId, filters));
  }

  /**
   * `GET /transactions/:id` — транзакция по идентификатору.
   * @param id - UUID транзакции
   * @param userId - id аутентифицированного пользователя из JWT
   * @returns найденная транзакция
   * @throws {NotFoundException} если транзакция не найдена или принадлежит другому пользователю
   */
  @ApiOperation({ summary: "Получить транзакцию по ID" })
  @ApiParam({ name: "id", description: "UUID транзакции", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  @ApiResponse({
    status: 200,
    description: "Транзакция найдена",
    schema: { example: TRANSACTION_EXAMPLE },
  })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @ApiResponse({
    status: 404,
    description: "Транзакция не найдена",
    schema: {
      example: { statusCode: 404, message: "Транзакция не найдена", error: "Not Found" },
    },
  })
  @Get(":id")
  findOne(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
  ): Promise<Transaction> {
    return this.queryBus.execute(new GetTransactionByIdQuery(id, userId));
  }

  /**
   * `PATCH /transactions/:id` — частичное обновление транзакции.
   * @param id - UUID транзакции
   * @param userId - id аутентифицированного пользователя из JWT
   * @param dto - поля для обновления (все опциональны)
   * @returns обновлённая транзакция
   * @throws {NotFoundException} если транзакция не найдена
   * @throws {BadRequestException} если новый `categoryId` не существует
   */
  @ApiOperation({ summary: "Обновить транзакцию" })
  @ApiParam({ name: "id", description: "UUID транзакции", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  @ApiResponse({
    status: 200,
    description: "Транзакция обновлена",
    schema: {
      example: { ...TRANSACTION_EXAMPLE, amount: "2000.00", description: "Зарплата за июнь", type: "INCOME" },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Невалидные данные или несуществующая категория",
    schema: {
      example: { statusCode: 400, message: "Указанная категория не существует", error: "Bad Request" },
    },
  })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @ApiResponse({
    status: 404,
    description: "Транзакция не найдена",
    schema: {
      example: { statusCode: 404, message: "Транзакция не найдена", error: "Not Found" },
    },
  })
  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.commandBus.execute(
      new UpdateTransactionCommand(id, userId, dto),
    );
  }

  /**
   * `DELETE /transactions/:id` — удаляет транзакцию. Возвращает 204 No Content.
   * @param id - UUID транзакции
   * @param userId - id аутентифицированного пользователя из JWT
   * @returns void
   * @throws {NotFoundException} если транзакция не найдена
   */
  @ApiOperation({ summary: "Удалить транзакцию" })
  @ApiParam({ name: "id", description: "UUID транзакции", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  @ApiResponse({ status: 204, description: "Транзакция удалена" })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @ApiResponse({
    status: 404,
    description: "Транзакция не найдена",
    schema: {
      example: { statusCode: 404, message: "Транзакция не найдена", error: "Not Found" },
    },
  })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteTransactionCommand(id, userId));
  }
}
