import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/** DTO для регистрации нового пользователя. */
export class RegisterDto {
  @ApiProperty({ example: "Олег Скареднов", description: "Отображаемое имя пользователя" })
  @IsString()
  name!: string;

  @ApiProperty({ example: "user@example.com", description: "Email — используется для входа" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "secret123", description: "Пароль (минимум 8 символов)" })
  @IsString()
  @MinLength(8)
  password!: string;
}
