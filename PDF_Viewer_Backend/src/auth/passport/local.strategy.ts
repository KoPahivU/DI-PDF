import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(private authService: AuthService) {
		super({ usernameField: 'gmail' });
	}

	async validate(gmail: string, password: string): Promise<any> {
		const user = await this.authService.validateUser(gmail, password);
		if (!user) {
			throw new UnauthorizedException('Invalid gmail/password');
		}

		if (user.isActive == false) {
			throw new BadRequestException("Account not activated")
		}
		return user;
	}
}
