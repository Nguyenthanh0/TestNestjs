import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  username: string;
  sub: string;
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configSV: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configSV.get<string>('JWT_SECRET_KEY') as string,
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    return { _id: payload.sub, name: payload.username };
  }
}
