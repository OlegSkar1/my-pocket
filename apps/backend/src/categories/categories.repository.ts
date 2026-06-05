import { Injectable } from "@nestjs/common";
import { Category } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({ data: { ...dto, userId } });
  }

  findManyByUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({ where: { userId } });
  }

  findByIdForUser(id: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id, userId } });
  }

  update(id: string, userId: string, dto: UpdateCategoryDto): Promise<Category> {
    return this.prisma.category.update({ where: { id, userId }, data: dto });
  }

  delete(id: string, userId: string): Promise<Category> {
    return this.prisma.category.delete({ where: { id, userId } });
  }
}
