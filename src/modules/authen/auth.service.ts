import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { comparePswHelper, hashPswHelper } from 'src/ulti/helper';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User, UserRole } from 'src/modules/users/entities/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from 'src/modules/users/users.service';
import { RegisterUserDto } from './dto/register.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { Verify2faUserDto } from '../users/dto/verify2fa.dto';
import { authenticator } from 'otplib';

export interface JwtUser {
  _id: string;
  email: string;
  role: UserRole;
  isTwoFAenabled: boolean;
}

export interface resetPayload {
  email: string;
}
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly configSv: ConfigService,
  ) {}

  async regiter(regisDto: RegisterUserDto) {
    const register = await this.usersService.register(regisDto);
    return 'Register successfully';
  }

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email });
    if (!user) {
      throw new HttpException('email not found', HttpStatus.NOT_FOUND);
    }
    const checkPasswd = await comparePswHelper(password, user.password);
    if (!checkPasswd) {
      throw new HttpException('Inavlid password', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  async login(user: JwtUser) {
    if (!user) {
      throw new UnauthorizedException('Email or password invalid ');
    }

    const payload = {
      email: user.email,
      sub: user._id,
      role: user.role,
    };
    if (!user.isTwoFAenabled) {
      return {
        message: 'Login successfully',
        access_token: this.jwtService.sign(payload),
      };
    } else {
      const twoFaPayload = {
        email: user.email,
      };
      return {
        message: '2FA is requied',
        twoFARequired: true,
        temp_token: this.jwtService.sign(twoFaPayload, {
          expiresIn: this.configSv.get('TEMP_TOKEN_EXPIRED'),
        }),
      };
    }
  }

  async loginWith2FA(tempToken: string, code: string) {
    const twoFaPayload: Partial<JwtUser> = this.jwtService.verify(tempToken);
    if (!twoFaPayload) {
      throw new BadRequestException('invalid token');
    }
    const user = await this.userModel.findOne({ email: twoFaPayload.email });

    if (!user || !user.twoFAsecret) {
      throw new UnauthorizedException('2FA not initialized');
    }
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFAsecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const payload = {
      email: user.email,
      sub: user._id,
      role: user.role,
    };

    return {
      message: 'Login successfully',
      access_token: this.jwtService.sign(payload),
    };
  }

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
    const resetToken = this.jwtService.sign(payload, {
      secret: this.configSv.get('JWT_RESETPASSWORD_KEY'),
      expiresIn: this.configSv.get('RESET_TOKEN_EXPIRED'),
    });

    return { message: 'Code verified', resetToken };
  }

  async resetPassword(password: string, resetToken: string) {
    const payload: resetPayload = this.jwtService.verify(resetToken, {
      secret: this.configSv.get('JWT_RESETPASSWORD_KEY'),
    });
    const user = await this.userModel.findOne({ email: payload.email });
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
