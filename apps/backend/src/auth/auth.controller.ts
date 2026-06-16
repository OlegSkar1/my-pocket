import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthResponse } from "@my-pocket/shared-types";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

const AUTH_RESPONSE_EXAMPLE = {
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjM2Q0ZTVmNi1hN2I4LTkwMTItY2RlZi0xMjM0NTY3ODkwMTIiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MTg0NTY0MDB9.signature",
  user: {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    name: "Олег Скареднов",
    email: "user@example.com",
  },
};

/**
 * Контроллер аутентификации (`/auth`).
 * Публичные эндпоинты — JWT не требуется.
 */
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * `POST /auth/register` — регистрирует нового пользователя.
   * @param dto - имя, email и пароль
   * @returns JWT-токен и краткий профиль пользователя
   * @throws {ConflictException} если email уже занят
   */
  @ApiOperation({ summary: "Зарегистрировать нового пользователя" })
  @ApiResponse({
    status: 201,
    description: "Пользователь создан, возвращает токен и профиль",
    schema: { example: AUTH_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 400,
    description: "Невалидные данные (например, не email или короткий пароль)",
    schema: {
      example: {
        statusCode: 400,
        message: ["email must be an email", "password must be longer than or equal to 8 characters"],
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Пользователь с таким email уже существует",
    schema: {
      example: { statusCode: 409, message: "Пользователь с таким email уже существует", error: "Conflict" },
    },
  })
  @Post("register")
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  /**
   * `POST /auth/login` — вход по email и паролю.
   * @param dto - email и пароль
   * @returns JWT-токен и краткий профиль пользователя
   * @throws {UnauthorizedException} если email не найден или пароль неверен
   */
  @ApiOperation({ summary: "Войти в систему" })
  @ApiResponse({
    status: 200,
    description: "Успешный вход, возвращает токен и профиль",
    schema: { example: AUTH_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 401,
    description: "Неверный email или пароль",
    schema: {
      example: { statusCode: 401, message: "Неверный email или пароль", error: "Unauthorized" },
    },
  })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }
}
