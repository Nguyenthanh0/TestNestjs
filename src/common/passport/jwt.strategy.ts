import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from 'src/modules/users/entities/user.schema';

export interface JwtPayload {
  email: string;
  sub: string;
  role: UserRole;
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
    return { _id: payload.sub, email: payload.email, role: payload.role };
  }
}
