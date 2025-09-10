import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService, JwtUser } from './auth.service';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { Public } from './decorator/customizeGuard';
import { RegisterUserDto } from './dto/register.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async handleLogin(@Request() req: { user: JwtUser }) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  async register(@Body() regisDto: RegisterUserDto) {
    return await this.authService.regiter(regisDto);
  }

  @Public()
  @Post('forgot-password')
  forgetPassword(@Body() emailDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(emailDto);
  }

  @Public()
  @Post('verify-code')
  verifyCode(@Body() emaildto: ForgetPasswordDto) {
    return this.authService.verifyCode(emaildto);
  }

  @Public()
  @Post('password/reset')
  resetPassword(@Body() body: { password: string; resetToken: string }) {
    const { password, resetToken } = body;
    return this.authService.resetPassword(password, resetToken);
  }
}
