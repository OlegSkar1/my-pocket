import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JWT_DEFAULT_EXPIRES_IN, JWT_DEFAULT_SECRET } from './auth.constants';

@Module({
	imports: [
		CqrsModule,
		UsersModule,
		PassportModule,
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService): JwtModuleOptions => ({
				secret: config.get<string>('JWT_SECRET', JWT_DEFAULT_SECRET),
				signOptions: {
					expiresIn: config.get<string>(
						'JWT_EXPIRES_IN',
						JWT_DEFAULT_EXPIRES_IN,
					) as JwtSignOptions['expiresIn'],
				},
			}),
		}),
	],
	providers: [AuthService, JwtStrategy],
	controllers: [AuthController],
})
export class AuthModule {}
