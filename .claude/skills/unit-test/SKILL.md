---
name: unit-test
description: Сгенерировать unit-тесты для NestJS-файла по переданному пути. Определяет тип артефакта (service / handler / controller / repository), читает зависимости и создаёт рядом `.spec.ts`.
allowed-tools: Read Glob Grep Write Bash(npm install *) Bash(npx jest *) Bash(cat *) Bash(ls *)
model: sonnet
argument-hint: <path-to-file>
---

## Аргумент

`$0` — путь к файлу относительно корня репозитория (например, `apps/backend/src/categories/categories.service.ts`).

Если аргумент не передан — попроси пользователя указать путь и прекрати выполнение.

## Шаг 1 — проверить Jest

Проверь, настроен ли Jest в `apps/backend/package.json` (ищи поле `"jest"` или скрипт `"test"`).

Если Jest **не настроен**:

1. Добавь скрипт `"test": "jest"` и `"test:watch": "jest --watch"` в `apps/backend/package.json`.
2. Добавь секцию `"jest"` в `apps/backend/package.json`:

```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

3. Установи dev-зависимости (если отсутствуют в `apps/backend/package.json`):

```bash
npm install --save-dev @nestjs/testing jest @types/jest ts-jest --workspace @my-pocket/backend
```

Сообщи пользователю, что настройка Jest выполнена.

## Шаг 2 — прочитать целевой файл

Прочитай файл по пути `$0`. Определи тип артефакта по суффиксу и содержимому:

| Суффикс / признак                              | Тип           |
|------------------------------------------------|---------------|
| `*.service.ts` / `@Injectable` + методы логики | **service**   |
| `*.handler.ts` / `implements ICommandHandler` или `IQueryHandler` | **handler**   |
| `*.controller.ts` / `@Controller`              | **controller**|
| `*.repository.ts` / `@Injectable` + `PrismaService` | **repository**|

## Шаг 3 — прочитать зависимости

Прочитай файлы, которые импортирует целевой файл (только из `src/` этого же воркспейса — пропускай `@nestjs/*`, `@prisma/*`, внешние пакеты). Нужно понять сигнатуры методов зависимостей, чтобы правильно их замокать.

## Шаг 4 — сгенерировать `.spec.ts`

Создай файл рядом с целевым: тот же путь, расширение `.spec.ts`.

Руководствуйся паттернами ниже в зависимости от типа артефакта.

---

### Паттерн: Service

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { <ServiceClass> } from './<file>';
import { <RepositoryClass> } from './<repo-file>';

describe('<ServiceClass>', () => {
  let service: <ServiceClass>;
  let repo: jest.Mocked<<RepositoryClass>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        <ServiceClass>,
        {
          provide: <RepositoryClass>,
          useValue: {
            // перечисли все публичные методы репозитория
            <method>: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<<ServiceClass>>(<ServiceClass>);
    repo = module.get(<RepositoryClass>) as jest.Mocked<<RepositoryClass>>;
  });

  // Для каждого публичного метода сервиса:
  describe('<methodName>', () => {
    it('должен вернуть результат от репозитория', async () => {
      // arrange
      repo.<repoMethod>.mockResolvedValue(<fixture>);
      // act
      const result = await service.<methodName>(<args>);
      // assert
      expect(repo.<repoMethod>).toHaveBeenCalledWith(<expectedArgs>);
      expect(result).toEqual(<fixture>);
    });

    // Тесты на ошибки — NotFoundException, ConflictException и т.д.
    it('должен бросить NotFoundException если ...', async () => {
      repo.<repoMethod>.mockResolvedValue(null);
      await expect(service.<methodName>(<args>)).rejects.toThrow(NotFoundException);
    });
  });
});
```

**Обязательно** покрой все `@throws`-сценарии из JSDoc методов:
- Prisma P2002 → `ConflictException`
- Prisma P2003 → `ConflictException` (связанные записи)
- `null` из репозитория → `NotFoundException`

**Мокинг нативных/CJS-модулей** (например, `bcrypt`): `jest.spyOn` не работает — свойства non-configurable. Используй `jest.mock` в начале файла (до импортов). Если модуль объявляет перегруженные функции (`@types/bcrypt`), `jest.mocked()` выводит `never` для возвращаемого типа — используй каст к `jest.Mock`:

```typescript
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
import * as bcrypt from 'bcrypt';

const bcryptHash = bcrypt.hash as jest.Mock;
const bcryptCompare = bcrypt.compare as jest.Mock;

// в тесте:
bcryptHash.mockResolvedValue('hashed');
bcryptCompare.mockResolvedValue(true);
```

Для симуляции Prisma-ошибок используй:

```typescript
import { Prisma } from '@prisma/client';

const prismaError = (code: string) => {
  const err = new Prisma.PrismaClientKnownRequestError('msg', {
    code,
    clientVersion: '0.0.0',
  });
  return err;
};
```

---

### Паттерн: Handler (CQRS)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { <HandlerClass> } from './<file>';
import { <ServiceClass> } from '../../<service-file>';
import { <CommandOrQuery> } from '../<command-or-query-file>';

describe('<HandlerClass>', () => {
  let handler: <HandlerClass>;
  let service: jest.Mocked<<ServiceClass>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        <HandlerClass>,
        {
          provide: <ServiceClass>,
          useValue: { <method>: jest.fn() },
        },
      ],
    }).compile();

    handler = module.get<<HandlerClass>>(<HandlerClass>);
    service = module.get(<ServiceClass>) as jest.Mocked<<ServiceClass>>;
  });

  it('должен делегировать вызов сервису и вернуть результат', async () => {
    service.<method>.mockResolvedValue(<fixture>);
    const command = new <CommandOrQuery>(<args>);
    const result = await handler.execute(command);
    expect(service.<method>).toHaveBeenCalledWith(<expectedArgs>);
    expect(result).toEqual(<fixture>);
  });
});
```

---

### Паттерн: Controller

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { <ControllerClass> } from './<file>';
import { <SomeCommand> } from './commands/<command-file>';

describe('<ControllerClass>', () => {
  let controller: <ControllerClass>;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [<ControllerClass>],
      providers: [
        { provide: CommandBus, useValue: { execute: jest.fn() } },
        { provide: QueryBus, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<<ControllerClass>>(<ControllerClass>);
    commandBus = module.get(CommandBus) as jest.Mocked<CommandBus>;
    queryBus = module.get(QueryBus) as jest.Mocked<QueryBus>;
  });

  // Для каждого маршрута — проверяй, что нужная команда/запрос диспатчится с правильными аргументами
  describe('<methodName>', () => {
    it('должен диспатчить <CommandOrQuery> с правильными аргументами', async () => {
      commandBus.execute.mockResolvedValue(<fixture>);
      const result = await controller.<methodName>(<userId>, <dto>);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: <userId>, dto: <dto> }),
      );
      expect(result).toEqual(<fixture>);
    });
  });
});
```

**Не тестируй Guards и декораторы** (`JwtAuthGuard`, `@CurrentUser`) — это ответственность интеграционных тестов.

---

### Паттерн: Repository

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { <RepositoryClass> } from './<file>';
import { PrismaService } from '../prisma/prisma.service';

describe('<RepositoryClass>', () => {
  let repo: <RepositoryClass>;
  let prisma: { <entity>: jest.Mocked<...> };

  beforeEach(async () => {
    prisma = {
      <entity>: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        <RepositoryClass>,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = module.get<<RepositoryClass>>(<RepositoryClass>);
  });

  // Для каждого метода — проверяй правильный Prisma-вызов и переданные аргументы
  describe('<methodName>', () => {
    it('должен вызвать prisma.<entity>.<operation> с корректными параметрами', async () => {
      prisma.<entity>.<operation>.mockResolvedValue(<fixture>);
      const result = await repo.<methodName>(<args>);
      expect(prisma.<entity>.<operation>).toHaveBeenCalledWith(<expectedPrismaArgs>);
      expect(result).toEqual(<fixture>);
    });
  });
});
```

---

## Правила генерации

- Тестируй только **публичные методы**.
- Каждый тест — один сценарий: happy path **и** все ошибочные ветки из JSDoc (`@throws`).
- Используй реалистичные фикстуры (UUID вида `'00000000-0000-0000-0000-000000000001'`, не `'id'`).
- Имена тестов — на **русском языке**, кратко и конкретно.
- Не мокай встроенные NestJS-исключения (`NotFoundException`, `ConflictException`) — они реальные.
- Не добавляй `beforeAll` / `afterAll`, если нет реальной причины.
- Не тестируй тривиальные делегаторы (handler только проксирует — один тест достаточно).

## Шаг 5 — сообщить пользователю

После записи файла сообщи:
- путь к созданному `.spec.ts`
- как запустить: `npx jest <relative-spec-path> --testPathPattern` из `apps/backend`
