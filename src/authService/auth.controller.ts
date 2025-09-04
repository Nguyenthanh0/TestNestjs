import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService, JwtUser } from './auth.service';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { Public } from './decorator/customizeGuard';
import { RegisterUserDto } from './dto/register.dtoi';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async handleLogin(@Request() req: { user: JwtUser }): Promise<any> {
    return this.authService.login(req.user);
  }

  @Get('profile')
  async getProfile(@Request() req: { user: JwtUser }) {
    return req.user;
  }

  @Public()
  @Post('register')
  async register(@Body() regisDto: RegisterUserDto) {
    return await this.authService.regiter(regisDto);
  }
}
