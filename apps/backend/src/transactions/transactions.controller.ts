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
import { TransactionsSummary } from "@my-pocket/shared-types";
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

@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateTransactionDto,
  ): Promise<Transaction> {
    return this.commandBus.execute(new CreateTransactionCommand(userId, dto));
  }

  @Get()
  findAll(
    @CurrentUser("userId") userId: string,
    @Query() filters: QueryTransactionsDto,
  ): Promise<Transaction[]> {
    return this.queryBus.execute(new GetTransactionsQuery(userId, filters));
  }

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

  @Get(":id")
  findOne(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
  ): Promise<Transaction> {
    return this.queryBus.execute(new GetTransactionByIdQuery(id, userId));
  }

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

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteTransactionCommand(id, userId));
  }
}
