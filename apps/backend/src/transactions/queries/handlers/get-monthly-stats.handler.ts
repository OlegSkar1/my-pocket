import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { MonthlyStats } from "@my-pocket/shared-types";
import { GetMonthlyStatsQuery } from "../get-monthly-stats.query";
import { TransactionsService } from "../../transactions.service";

@QueryHandler(GetMonthlyStatsQuery)
export class GetMonthlyStatsHandler
  implements IQueryHandler<GetMonthlyStatsQuery, MonthlyStats>
{
  constructor(private readonly transactionsService: TransactionsService) {}

  execute(query: GetMonthlyStatsQuery): Promise<MonthlyStats> {
    return this.transactionsService.monthly(query.userId, query.filters);
  }
}
