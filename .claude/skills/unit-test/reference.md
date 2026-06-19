# Паттерны генерации тестов

## Паттерн: Service

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
            <method>: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<<ServiceClass>>(<ServiceClass>);
    repo = module.get(<RepositoryClass>) as jest.Mocked<<RepositoryClass>>;
  });

  describe('<methodName>', () => {
    it('должен вернуть результат от репозитория', async () => {
      repo.<repoMethod>.mockResolvedValue(<fixture>);
      const result = await service.<methodName>(<args>);
      expect(repo.<repoMethod>).toHaveBeenCalledWith(<expectedArgs>);
      expect(result).toEqual(<fixture>);
    });

    it('должен бросить NotFoundException если ...', async () => {
      repo.<repoMethod>.mockResolvedValue(null);
      await expect(service.<methodName>(<args>)).rejects.toThrow(NotFoundException);
    });
  });
});
```

**Обязательно** покрой все `@throws`-сценарии:
- Prisma P2002 → `ConflictException`
- Prisma P2003 → `ConflictException` (связанные записи)
- `null` из репозитория → `NotFoundException`

**Мокинг нативных/CJS-модулей** (например, `bcrypt`): `jest.spyOn` не работает. Используй `jest.mock` в начале файла:

```typescript
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
import * as bcrypt from 'bcrypt';

const bcryptHash = bcrypt.hash as jest.Mock;
const bcryptCompare = bcrypt.compare as jest.Mock;
```

Для симуляции Prisma-ошибок:

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

## Паттерн: Handler (CQRS)

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

## Паттерн: Controller

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { <ControllerClass> } from './<file>';

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

## Паттерн: Repository

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
