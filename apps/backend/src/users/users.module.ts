import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { CreateUserHandler } from './commands/handlers/create-user.handler';
import { GetUserByEmailHandler } from './queries/handlers/get-user-by-email.handler';
import { GetUserByIdHandler } from './queries/handlers/get-user-by-id.handler';

const CommandHandlers = [CreateUserHandler];
const QueryHandlers = [GetUserByEmailHandler, GetUserByIdHandler];

@Module({
	imports: [CqrsModule],
	providers: [UsersRepository, UsersService, ...CommandHandlers, ...QueryHandlers],
})
export class UsersModule {}
