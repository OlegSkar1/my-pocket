import { ConflictException, Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }

  async create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new ConflictException("Пользователь с таким email уже существует");
    }
    return this.repo.create(data);
  }
}
