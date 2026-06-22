/** Запрос пользователя по UUID. */
export class GetUserByIdQuery {
	/** @param id - UUID пользователя */
	constructor(public readonly id: string) {}
}
