import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { User } from "@prisma/client";
import { GetUserByIdQuery } from "../get-user-by-id.query";
import { UsersService } from "../../users.service";

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, User | null> {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Выполняет запрос пользователя по UUID.
   * @param query - запрос с `id`
   * @returns пользователь или `null`, если не найден
   */
  execute(query: GetUserByIdQuery): Promise<User | null> {
    return this.usersService.findById(query.id);
  }
}
