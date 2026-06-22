import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { User } from '@prisma/client';
import { GetUserByEmailQuery } from '../get-user-by-email.query';
import { UsersService } from '../../users.service';

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery, User | null> {
	constructor(private readonly usersService: UsersService) {}

	/**
	 * Выполняет запрос пользователя по email.
	 * @param query - запрос с `email`
	 * @returns пользователь или `null`, если не найден
	 */
	execute(query: GetUserByEmailQuery): Promise<User | null> {
		return this.usersService.findByEmail(query.email);
	}
}
