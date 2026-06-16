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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CreateCategoryCommand } from "./commands/create-category.command";
import { UpdateCategoryCommand } from "./commands/update-category.command";
import { DeleteCategoryCommand } from "./commands/delete-category.command";
import { GetCategoriesQuery } from "./queries/get-categories.query";
import { GetCategoryByIdQuery } from "./queries/get-category-by-id.query";

const CATEGORY_EXAMPLE = {
  id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  name: "Продукты",
  color: "#4CAF50",
  icon: "shopping-cart",
  userId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
  createdAt: "2024-06-01T00:00:00.000Z",
  updatedAt: "2024-06-01T00:00:00.000Z",
};

/**
 * Контроллер категорий (`/categories`).
 * Все маршруты защищены JWT-аутентификацией.
 * Делегирует обработку на CQRS-шины без бизнес-логики.
 */
@ApiTags("categories")
@ApiBearerAuth()
@Controller("categories")
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * `POST /categories` — создаёт категорию.
   * @param userId - id аутентифицированного пользователя из JWT
   * @param dto - данные новой категории
   * @returns созданная категория
   * @throws {ConflictException} если категория с таким именем уже существует
   */
  @ApiOperation({ summary: "Создать категорию" })
  @ApiResponse({
    status: 201,
    description: "Категория создана",
    schema: { example: CATEGORY_EXAMPLE },
  })
  @ApiResponse({
    status: 400,
    description: "Невалидные данные (например, неверный HEX-цвет)",
    schema: {
      example: { statusCode: 400, message: ["color must match /^#([0-9a-fA-F]{6})$/"], error: "Bad Request" },
    },
  })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @ApiResponse({
    status: 409,
    description: "Категория с таким именем уже существует",
    schema: {
      example: { statusCode: 409, message: "Категория с именем \"Продукты\" уже существует", error: "Conflict" },
    },
  })
  @Post()
  create(
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<Category> {
    return this.commandBus.execute(new CreateCategoryCommand(userId, dto));
  }

  /**
   * `GET /categories` — список всех категорий пользователя.
   * @param userId - id аутентифицированного пользователя из JWT
   * @returns массив категорий
   */
  @ApiOperation({ summary: "Получить список категорий" })
  @ApiResponse({
    status: 200,
    description: "Список категорий пользователя",
    schema: { example: [CATEGORY_EXAMPLE] },
  })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @Get()
  findAll(@CurrentUser("userId") userId: string): Promise<Category[]> {
    return this.queryBus.execute(new GetCategoriesQuery(userId));
  }

  /**
   * `GET /categories/:id` — категория по идентификатору.
   * @param id - UUID категории
   * @param userId - id аутентифицированного пользователя из JWT
   * @returns найденная категория
   * @throws {NotFoundException} если категория не найдена или принадлежит другому пользователю
   */
  @ApiOperation({ summary: "Получить категорию по ID" })
  @ApiParam({ name: "id", description: "UUID категории", example: "b2c3d4e5-f6a7-8901-bcde-f12345678901" })
  @ApiResponse({
    status: 200,
    description: "Категория найдена",
    schema: { example: CATEGORY_EXAMPLE },
  })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @ApiResponse({
    status: 404,
    description: "Категория не найдена",
    schema: {
      example: { statusCode: 404, message: "Категория не найдена", error: "Not Found" },
    },
  })
  @Get(":id")
  findOne(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
  ): Promise<Category> {
    return this.queryBus.execute(new GetCategoryByIdQuery(id, userId));
  }

  /**
   * `PATCH /categories/:id` — частичное обновление категории.
   * @param id - UUID категории
   * @param userId - id аутентифицированного пользователя из JWT
   * @param dto - поля для обновления (все опциональны)
   * @returns обновлённая категория
   * @throws {NotFoundException} если категория не найдена
   * @throws {ConflictException} если новое имя уже занято
   */
  @ApiOperation({ summary: "Обновить категорию" })
  @ApiParam({ name: "id", description: "UUID категории", example: "b2c3d4e5-f6a7-8901-bcde-f12345678901" })
  @ApiResponse({
    status: 200,
    description: "Категория обновлена",
    schema: {
      example: { ...CATEGORY_EXAMPLE, name: "Кафе и рестораны", color: "#FF5722", icon: "utensils" },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Невалидные данные",
    schema: {
      example: { statusCode: 400, message: ["color must match /^#([0-9a-fA-F]{6})$/"], error: "Bad Request" },
    },
  })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @ApiResponse({
    status: 404,
    description: "Категория не найдена",
    schema: {
      example: { statusCode: 404, message: "Категория не найдена", error: "Not Found" },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Категория с таким именем уже существует",
    schema: {
      example: { statusCode: 409, message: "Категория с именем \"Кафе и рестораны\" уже существует", error: "Conflict" },
    },
  })
  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.commandBus.execute(new UpdateCategoryCommand(id, userId, dto));
  }

  /**
   * `DELETE /categories/:id` — удаляет категорию. Возвращает 204 No Content.
   * @param id - UUID категории
   * @param userId - id аутентифицированного пользователя из JWT
   * @returns void
   * @throws {NotFoundException} если категория не найдена
   * @throws {ConflictException} если есть связанные транзакции
   */
  @ApiOperation({ summary: "Удалить категорию" })
  @ApiParam({ name: "id", description: "UUID категории", example: "b2c3d4e5-f6a7-8901-bcde-f12345678901" })
  @ApiResponse({ status: 204, description: "Категория удалена" })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @ApiResponse({
    status: 404,
    description: "Категория не найдена",
    schema: {
      example: { statusCode: 404, message: "Категория не найдена", error: "Not Found" },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Нельзя удалить — есть связанные транзакции",
    schema: {
      example: {
        statusCode: 409,
        message: "Нельзя удалить категорию, пока есть связанные транзакции",
        error: "Conflict",
      },
    },
  })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteCategoryCommand(id, userId));
  }
}
