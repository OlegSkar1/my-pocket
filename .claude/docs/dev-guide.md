# Гайд по разработке

## Добавить новый бэкенд-модуль

Шаблон на примере гипотетического модуля `budgets`.

### 1. Создать структуру файлов

```
src/budgets/
├─ budgets.module.ts
├─ budgets.controller.ts
├─ budgets.service.ts
├─ budgets.repository.ts
├─ dto/
│  ├─ create-budget.dto.ts
│  └─ update-budget.dto.ts
├─ commands/
│  ├─ create-budget.command.ts
│  └─ handlers/
│     └─ create-budget.handler.ts
└─ queries/
   ├─ get-budgets.query.ts
   └─ handlers/
      └─ get-budgets.handler.ts
```

### 2. Описать DTO

```typescript
// dto/create-budget.dto.ts
import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateBudgetDto {
  @ApiProperty({ example: "Март 2024", description: "Название бюджета" })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
```

Все поля DTO должны иметь `@ApiProperty` / `@ApiPropertyOptional`.

### 3. Написать команду и хендлер

```typescript
// commands/create-budget.command.ts
export class CreateBudgetCommand {
  /** @param userId - id владельца  @param dto - данные */
  constructor(
    public readonly userId: string,
    public readonly dto: CreateBudgetDto,
  ) {}
}

// commands/handlers/create-budget.handler.ts
@CommandHandler(CreateBudgetCommand)
export class CreateBudgetHandler implements ICommandHandler<CreateBudgetCommand, Budget> {
  constructor(private readonly budgetsService: BudgetsService) {}

  execute(command: CreateBudgetCommand): Promise<Budget> {
    return this.budgetsService.create(command.userId, command.dto);
  }
}
```

### 4. Написать репозиторий

Только Prisma-вызовы. Никакой логики.

```typescript
@Injectable()
export class BudgetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateBudgetDto): Promise<Budget> {
    return this.prisma.budget.create({ data: { ...dto, userId } });
  }
}
```

Все методы скоупируются по `userId` — никаких запросов без него.

### 5. Написать сервис

Доменная логика + маппинг Prisma-ошибок.

```typescript
@Injectable()
export class BudgetsService {
  constructor(private readonly repo: BudgetsRepository) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<Budget> {
    try {
      return await this.repo.create(userId, dto);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(`Бюджет "${dto.name}" уже существует`);
      }
      throw err;
    }
  }
}
```

### 6. Написать контроллер

Только роутинг + шина. Никакой логики.

```typescript
@ApiTags("budgets")
@ApiBearerAuth()
@Controller("budgets")
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * `POST /budgets` — создаёт бюджет.
   * @param userId - id пользователя из JWT
   * @param dto - данные бюджета
   * @returns созданный бюджет
   */
  @ApiOperation({ summary: "Создать бюджет" })
  @ApiResponse({ status: 201, description: "Бюджет создан", schema: { example: { id: "uuid", name: "Март 2024" } } })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @Post()
  create(
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateBudgetDto,
  ): Promise<Budget> {
    return this.commandBus.execute(new CreateBudgetCommand(userId, dto));
  }
}
```

### 7. Зарегистрировать модуль

```typescript
// budgets.module.ts
@Module({
  imports: [CqrsModule],
  controllers: [BudgetsController],
  providers: [
    BudgetsService,
    BudgetsRepository,
    CreateBudgetHandler,
    GetBudgetsHandler,
  ],
})
export class BudgetsModule {}
```

```typescript
// app.module.ts — добавить в imports
import { BudgetsModule } from "./budgets/budgets.module";

@Module({
  imports: [
    // ...существующие
    BudgetsModule,
  ],
})
export class AppModule {}
```

### 8. Если контракт публичный — обновить shared-types

```typescript
// packages/shared-types/src/index.ts
export interface Budget {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

Изменения shared-types, бэка и фронта — в одном PR.

---

## Добавить фичу в существующий модуль

1. Создать `*.command.ts` или `*.query.ts` с нужными полями.
2. Создать `handlers/*.handler.ts` — реализовать `execute`.
3. Добавить метод в сервис и репозиторий.
4. Добавить метод в контроллер с JSDoc + Swagger-декораторами.
5. Зарегистрировать хендлер в `providers` модуля.
6. Обновить `@my-pocket/shared-types` и `api.md`, если изменился публичный контракт.

---

## Добавить миграцию БД

### Шаги

```bash
# 1. Внести изменения в prisma/schema.prisma

# 2. Создать и применить миграцию (из apps/backend или корня монорепо)
npm run prisma:migrate -- --name <kebab-name-описание>
# Например: --name add-budget-model

# 3. Prisma автоматически запустит prisma generate после migrate dev.
#    Если нужно вручную:
npm run prisma:generate
```

### Правила именования миграций

Формат `--name`: `kebab-case`, описывает суть изменения.

```
add-budget-model
add-index-transactions-date
rename-expense-to-amount
```

### После изменения Decimal-полей

Если добавлено или изменено поле типа `Decimal` — синхронизировать `@my-pocket/shared-types`: Prisma отдаёт `Decimal` как `string` в JSON.

---

## Добавить фронтенд-фичу

### Структура слайса

```
src/features/<feature-name>/
├─ model/
│  ├─ use-<feature>.ts    # TanStack Query хук или zustand экшн
│  └─ <feature>.schema.ts # Zod-схема для формы (если есть)
├─ ui/
│  └─ <feature-name>.tsx  # React-компонент
└─ index.ts               # публичный API — экспортировать только нужное
```

### Правила

- Импортировать из `@my-pocket/shared-types`, не писать локальные дублирующие типы.
- Query keys держать в `entities/<name>/model` — виджеты и фичи ссылаются на них.
- После мутации инвалидировать все затронутые ключи:
  ```typescript
  queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  queryClient.invalidateQueries({ queryKey: transactionKeys.summary() });
  ```
- Ошибки не ловить в компонентах без нужды — глобальный `MutationCache` в `providers.tsx` уже показывает тост.
- Использовать `ResponsiveModal` (Dialog на desktop / Drawer на мобиле) для форм.

---

## Чеклист перед PR

- [ ] `npm run lint` — без ошибок
- [ ] `npm run build` — без ошибок
- [ ] JSDoc на новых методах контроллера, сервиса, репозитория
- [ ] Swagger-декораторы на новых эндпоинтах (`@ApiOperation`, `@ApiResponse` с примерами)
- [ ] `@ApiProperty` на полях новых DTO
- [ ] Обновлён `api.md` если изменился публичный API
- [ ] Обновлён `shared-types` если изменился контракт
- [ ] Прошёл золотой путь вручную: `npm run dev:backend` + `npm run dev:frontend`
