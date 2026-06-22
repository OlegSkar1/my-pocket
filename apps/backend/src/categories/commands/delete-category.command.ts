/** Команда удаления категории. Диспатчится из `CategoriesController.delete`. */
export class DeleteCategoryCommand {
	/**
	 * @param id - UUID удаляемой категории
	 * @param userId - id владельца (для изоляции)
	 */
	constructor(
		public readonly id: string,
		public readonly userId: string,
	) {}
}
