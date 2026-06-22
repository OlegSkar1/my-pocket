import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_DEFAULT_SECRET } from '../auth.constants';

export interface JwtPayload {
	sub: string;
	email: string;
}

export interface AuthenticatedUser {
	userId: string;
	email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(config: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: config.get<string>('JWT_SECRET', JWT_DEFAULT_SECRET),
		});
	}

	validate(payload: JwtPayload): AuthenticatedUser {
		return { userId: payload.sub, email: payload.email };
	}
}
