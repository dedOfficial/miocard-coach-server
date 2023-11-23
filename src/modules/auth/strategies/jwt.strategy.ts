import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TokenMobilePayload,
  TokenWebPayload,
} from '../interfaces/token-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any): Promise<TokenWebPayload | TokenMobilePayload> {
    if (payload.name) {
      return {
        name: payload.name,
        email: payload.email,
        roles: payload.roles,
      };
    } else if (payload.phone) {
      return {
        phone: payload.phone,
      };
    }
  }
}
