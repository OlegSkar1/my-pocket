import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { User } from "@prisma/client";
import { CreateUserCommand } from "../create-user.command";
import { UsersService } from "../../users.service";

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, User> {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Выполняет команду создания пользователя.
   * @param command - команда с именем, email и хешем пароля
   * @returns созданный пользователь
   * @throws {ConflictException} если email уже занят
   */
  execute(command: CreateUserCommand): Promise<User> {
    return this.usersService.create({
      name: command.name,
      email: command.email,
      passwordHash: command.passwordHash,
    });
  }
}
