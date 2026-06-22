/**
 * Общие дефолты аутентификации. Держим их в одной точке, чтобы значение
 * секрета не разъехалось между `AuthModule` (подпись токена) и
 * `JwtStrategy` (его валидация).
 */

/** Дефолтный JWT-секрет для dev. В проде обязательно переопределяется через `JWT_SECRET`. */
export const JWT_DEFAULT_SECRET = 'change-me-in-production';

/** Дефолтный срок жизни access-токена (формат `@nestjs/jwt` / `ms`). */
export const JWT_DEFAULT_EXPIRES_IN = '15m';
