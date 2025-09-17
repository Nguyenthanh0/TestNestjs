import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService, JwtUser } from './auth.service';
import { LocalAuthGuard } from '../../common/passport/local-auth.guard';
import { RegisterUserDto } from './dto/register.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { Public } from 'src/common/decorator/customizeGuard';
import { Verify2faUserDto } from '../users/dto/verify2fa.dto';

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
  @Post('login/2fa')
  login2fa(@Body('temptoken') temptoken: string, @Body('code') code: string) {
    return this.authService.loginWith2FA(temptoken, code);
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
