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
import { MailService } from '../mail/mail.service';

export interface JwtUser {
  _id: string;
  identifier: string;
  email: string;
  name: string;
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
    private readonly mailService: MailService,
  ) {}

  async regiter(regisDto: RegisterUserDto) {
    const existEmail = await this.userModel.findOne({ email: regisDto.email });
    if (existEmail) {
      throw new BadRequestException('This email has already existed');
    }
    const existName = await this.userModel.findOne({ name: regisDto.name });
    if (existName) {
      throw new BadRequestException('This username has already existed');
    }

    const hassPwd = await hashPswHelper(regisDto.password);
    const createUser = new this.userModel({
      ...regisDto,
      password: hassPwd,
    });
    const result = await createUser.save();
    return { message: 'register successfully', data: result.email };
  }

  async validateUser(identifier: string, password: string) {
    const isEmail = /\S+@\S+\.\S+/.test(identifier);
    const user = isEmail
      ? await this.userModel.findOne({ email: identifier }).exec()
      : await this.userModel.findOne({ name: identifier }).exec();
    if (!user) {
      throw new HttpException('user not found', HttpStatus.NOT_FOUND);
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

    const language = emaildto.language || 'vn';
    await this.mailService.sendEmailForgotPassword(
      user.email,
      user.name,
      resetCode,
      language,
    );
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
