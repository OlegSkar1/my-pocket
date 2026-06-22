import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TransactionsSummary } from '@my-pocket/shared-types';
import { GetTransactionsSummaryQuery } from '../get-transactions-summary.query';
import { TransactionsService } from '../../transactions.service';

@QueryHandler(GetTransactionsSummaryQuery)
export class GetTransactionsSummaryHandler implements IQueryHandler<GetTransactionsSummaryQuery, TransactionsSummary> {
	constructor(private readonly transactionsService: TransactionsService) {}

	/**
	 * Выполняет запрос сводки по транзакциям.
	 * @param query - запрос с `userId` и `filters`
	 * @returns агрегированная сводка доходов, расходов и баланса
	 */
	execute(query: GetTransactionsSummaryQuery): Promise<TransactionsSummary> {
		return this.transactionsService.summary(query.userId, query.filters);
	}
}
