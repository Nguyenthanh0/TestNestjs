import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/authen/auth.service';
import { User } from 'src/modules/users/entities/user.schema';
import { LoginUserDto } from 'src/modules/authen/dto/login.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'identifier' });
  }

  async validate(identifier: string, password: string) {
    const user = (await this.authService.validateUser(
      identifier,
      password,
    )) as User;
    if (!user) {
      throw new UnauthorizedException('User or password incorrect');
    }
    return user;
  }
}
