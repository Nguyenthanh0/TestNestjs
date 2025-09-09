import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { log } from 'node:console';

@Injectable()
export class ResetPassStrategy extends PassportStrategy(
  Strategy,
  'resetpass-token',
) {
  constructor(private configSV: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configSV.get<string>('JWT_RESETPASSWORD_KEY') as string,
    });
  }

  async validate(payload: { email: string }) {
    return { email: payload.email };
  }
}
