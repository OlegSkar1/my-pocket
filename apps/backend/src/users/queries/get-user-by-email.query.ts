/** Запрос пользователя по email. Используется в `AuthService.login`. */
export class GetUserByEmailQuery {
  /** @param email - email для поиска */
  constructor(public readonly email: string) {}
}
