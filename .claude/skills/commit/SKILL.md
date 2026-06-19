---
name: commit
description: Создать коммит в текущей ветке по правилам проекта (Conventional Commits). Использовать только вручную — не запускать автоматически.
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git add *) Bash(git commit *)
model: sonnet
effort: low
---

## Контекст выполнения

- Статус проекта: ! `git status`
- Последние коммиты: ! `git log --oneline -5`

## Подготовка

1. Проверь текущую ветку: `git branch --show-current`. Если `main` — **создай ветку автоматически** перед коммитом:
   - Изучи `git diff --stat` и `git status`, чтобы понять характер изменений.
   - Подбери префикс и краткое имя: см. [template.md](template.md) → «Именование веток».
   - Создай ветку: `git checkout -b <prefix>/<name>`.
   - Сообщи пользователю, какую ветку создал.

## Создание коммита

Формат: `<type>(<scope>): <описание на русском языке>` — строчными, без точки.

Типы и скоупы — в [template.md](template.md).

Добавь нужные файлы (предпочитай конкретные файлы, не `git add .`), затем:

```bash
git commit -m "$(cat <<'EOF'
feat(scope): описание
EOF
)"
```

После коммита выполни `git status` для подтверждения.
