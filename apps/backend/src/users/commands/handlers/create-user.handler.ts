import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { User } from "@prisma/client";
import { CreateUserCommand } from "../create-user.command";
import { UsersService } from "../../users.service";

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, User> {
  constructor(private readonly usersService: UsersService) {}

  execute(command: CreateUserCommand): Promise<User> {
    return this.usersService.create({
      name: command.name,
      email: command.email,
      passwordHash: command.passwordHash,
    });
  }
}
