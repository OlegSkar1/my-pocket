/** Команда создания пользователя. Диспатчится из `AuthService.register`. */
export class CreateUserCommand {
	/**
	 * @param name - отображаемое имя
	 * @param email - уникальный email
	 * @param passwordHash - bcrypt-хеш пароля (rounds = 10)
	 */
	constructor(
		public readonly name: string,
		public readonly email: string,
		public readonly passwordHash: string,
	) {}
}
