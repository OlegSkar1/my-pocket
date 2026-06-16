/** Запрос одной категории по UUID в скоупе пользователя. */
export class GetCategoryByIdQuery {
  /**
   * @param id - UUID категории
   * @param userId - id владельца (для изоляции)
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
