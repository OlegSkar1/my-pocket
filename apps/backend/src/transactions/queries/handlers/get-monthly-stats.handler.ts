import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { MonthlyStats } from "@my-pocket/shared-types";
import { GetMonthlyStatsQuery } from "../get-monthly-stats.query";
import { TransactionsService } from "../../transactions.service";

@QueryHandler(GetMonthlyStatsQuery)
export class GetMonthlyStatsHandler
  implements IQueryHandler<GetMonthlyStatsQuery, MonthlyStats>
{
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Выполняет запрос помесячной статистики.
   * @param query - запрос с `userId` и `filters`
   * @returns массив `{ month, income, expense }` за каждый месяц диапазона
   */
  execute(query: GetMonthlyStatsQuery): Promise<MonthlyStats> {
    return this.transactionsService.monthly(query.userId, query.filters);
  }
}
