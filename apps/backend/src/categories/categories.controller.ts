import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { Category } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CreateCategoryCommand } from "./commands/create-category.command";
import { UpdateCategoryCommand } from "./commands/update-category.command";
import { DeleteCategoryCommand } from "./commands/delete-category.command";
import { GetCategoriesQuery } from "./queries/get-categories.query";
import { GetCategoryByIdQuery } from "./queries/get-category-by-id.query";

@Controller("categories")
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<Category> {
    return this.commandBus.execute(new CreateCategoryCommand(userId, dto));
  }

  @Get()
  findAll(@CurrentUser("userId") userId: string): Promise<Category[]> {
    return this.queryBus.execute(new GetCategoriesQuery(userId));
  }

  @Get(":id")
  findOne(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
  ): Promise<Category> {
    return this.queryBus.execute(new GetCategoryByIdQuery(id, userId));
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.commandBus.execute(new UpdateCategoryCommand(id, userId, dto));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteCategoryCommand(id, userId));
  }
}
