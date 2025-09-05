import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { comparePswHelper } from 'src/ulti/helper';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User } from 'src/modules/users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from 'src/modules/users/users.service';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { RegisterUserDto } from './dto/register.dtoi';

export interface JwtUser {
  _id: string;
  name: string;
}
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ name: username });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const checkPasswd = await comparePswHelper(password, user.password);
    if (!checkPasswd) {
      throw new HttpException('Inavlid password', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  async login(user: JwtUser) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const payload = { username: user.name, sub: user._id };
    return {
      message: 'Login successfully',
      access_token: this.jwtService.sign(payload),
    };
  }

  async regiter(regisDto: RegisterUserDto) {
    const register = await this.usersService.register(regisDto);
    return 'Register successfully';
  }
}
