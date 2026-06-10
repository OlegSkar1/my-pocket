import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Category, Prisma } from "@prisma/client";
import { CategoriesRepository } from "./categories.repository";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    try {
      return await this.repo.create(userId, dto);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(`Категория с именем "${dto.name}" уже существует`);
      }
      throw err;
    }
  }

  findManyByUser(userId: string): Promise<Category[]> {
    return this.repo.findManyByUser(userId);
  }

  async findByIdForUser(id: string, userId: string): Promise<Category> {
    const category = await this.repo.findByIdForUser(id, userId);
    if (!category) throw new NotFoundException("Категория не найдена");
    return category;
  }

  async update(id: string, userId: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findByIdForUser(id, userId);
    try {
      return await this.repo.update(id, userId, dto);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(`Категория с именем "${dto.name}" уже существует`);
      }
      throw err;
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findByIdForUser(id, userId);
    try {
      await this.repo.delete(id, userId);
    } catch (err) {
      // P2003 — нарушение внешнего ключа: есть связанные транзакции (onDelete: Restrict)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        throw new ConflictException(
          "Нельзя удалить категорию, пока есть связанные транзакции",
        );
      }
      throw err;
    }
  }
}
