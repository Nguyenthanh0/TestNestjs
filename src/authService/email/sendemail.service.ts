import { JwtService } from '@nestjs/jwt';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/modules/users/schemas/user.schema';
import { ForgetPasswordDto } from '../dto/forget-password.dtoi';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { hashPswHelper } from 'src/ulti/helper';

@Injectable()
export class sendEmailService {
  constructor(
    private readonly mailerService: MailerService,
    @InjectModel(User.name) private userModel: Model<User>,
    private JwtService: JwtService,
  ) {}

  async forgetPassword(emaildto: ForgetPasswordDto) {
    const user = await this.userModel.findOne({ email: emaildto.email });
    if (!user) {
      throw new HttpException('invalid email', HttpStatus.NOT_FOUND);
    }
    const resetCode = uuidv4().slice(0, 5).toUpperCase();

    user.resetCode = resetCode;
    user.resetCodeExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
    await user.save();

    await this.mailerService
      .sendMail({
        to: user.email, // list of receivers
        subject: 'Reset your Password ✔', // Subject line
        template: 'reset-passwd', // The `.hbs` extension is appended automatically
        context: {
          name: user.name,
          resetCode: resetCode,
        },
      })
      .then(() => {})
      .catch(() => {});
    return { message: 'Reset code sent to email' };
  }

  async verifyCode(emailDto: ForgetPasswordDto) {
    const user = await this.userModel.findOne({ email: emailDto.email });
    if (
      !user ||
      user.resetCode !== emailDto.code ||
      !user.resetCodeExpire ||
      user.resetCodeExpire < new Date()
    ) {
      throw new NotFoundException('Invalid code or email');
    }
    const payload = { email: user.email };
    const resetToken = this.JwtService.sign(payload);

    return { message: 'Code verified', resetToken };
  }

  async resetPassword(password: string, email: string) {
    const user = await this.userModel.findOne({ email });
    if (
      !user ||
      !user.resetCode ||
      !user.resetCodeExpire ||
      user.resetCodeExpire < new Date()
    ) {
      throw new NotFoundException('Invalid code or email');
    }
    const hashPassword = await hashPswHelper(password);
    user.password = hashPassword;
    user.resetCode = null;
    user.resetCodeExpire = null;
    await user.save();
    return { message: 'Password updated successfully', user: user.name };
  }
}
