---
name: merge
description: Смержить текущий PR в main, проведя проверки по чеклисту REVIEW.md. Использовать только вручную после /pr.
allowed-tools: Bash(git *) Bash(gh *) Bash(npm *)
model: sonnet
---

## Подготовка

Выполни параллельно, чтобы понять контекст:

```bash
gh pr view --json number,title,headRefName,state,url   # данные PR
git log main..HEAD --oneline                            # коммиты ветки
git diff main --stat                                    # затронутые файлы
```

Убедись, что PR существует и находится в состоянии `OPEN`. Если PR не найден — сообщи пользователю и остановись.

---

документация по чеклисту [REVIEW.md](../../../REVIEW.md)
