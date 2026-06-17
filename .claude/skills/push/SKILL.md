---
name: push
description: Запушить текущую ветку на remote. Использовать только вручную после /commit.
allowed-tools: Bash(git branch *) Bash(git push *) Bash(git status *) Bash(git log *)
model: sonnet
---

## Подготовка

1. Проверь текущую ветку: `git branch --show-current`. Если `main` — **создай ветку автоматически** перед пушем:

   - Изучи `git log main..HEAD --oneline` и `git diff main --stat`, чтобы понять характер изменений.
   - Подбери префикс (`feat/`, `fix/`, `refactor/`, `docs/`, `chore/`) и краткое имя на английском в kebab-case, отражающее суть коммитов.
   - Создай ветку: `git checkout -b <prefix>/<name>` (например, `feat/expense-filter`, `docs/readme-setup`).
   - Сообщи пользователю, какую ветку создал.

2. Выполни `git status` и `git log @{u}..HEAD --oneline`, чтобы убедиться, что есть коммиты для пуша.

## Пуш

Если ветка уже существует на remote:

```bash
git push
```

Если ветка новая (нет upstream):

```bash
git push -u origin <branch-name>
```

## После пуша

Сообщи результат и напомни, что следующий шаг — создание Pull Request через `/pr`.
