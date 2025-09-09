import { ForgetPasswordDto } from '../dto/forget-password.dtoi';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Public } from '../decorator/customizeGuard';
import { sendEmailService } from './sendemail.service';
import { ResetPassAuthGuard } from '../passport/resetpass-token.guard';
import e from 'express';

@Controller('email')
export class sendEmailController {
  constructor(private readonly sendEmailService: sendEmailService) {}

  @Public()
  @Post('forget-password')
  forgetPassword(@Body() emailDto: ForgetPasswordDto) {
    return this.sendEmailService.forgetPassword(emailDto);
  }

  @Public()
  @Post('verify-code')
  verifyCode(@Body() emaildto: ForgetPasswordDto) {
    return this.sendEmailService.verifyCode(emaildto);
  }

  @Public()
  @UseGuards(ResetPassAuthGuard)
  @Post('reset-password')
  resetPassword(
    @Body('password') password: string,
    @Req() req: { user: { email: string } },
  ) {
    const email = req.user.email;
    return this.sendEmailService.resetPassword(password, email);
  }
}
