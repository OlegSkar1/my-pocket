/** Запрос списка всех категорий пользователя. */
export class GetCategoriesQuery {
	/** @param userId - id владельца */
	constructor(public readonly userId: string) {}
}
