import { IsNotEmpty } from 'class-validator';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.schema';
import { Model } from 'mongoose';
import { hashPswHelper } from 'src/ulti/helper';
import { RegisterUserDto } from 'src/modules/authen/dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtUser } from '../authen/auth.service';
import { ForgetPasswordDto } from '../authen/dto/forget-password.dto';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { Verify2faUserDto } from './dto/verify2fa.dto';

export interface changeEmailPayload {
  _id: string;
  email: string;
}
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  //hàm check email
  checkEmail = async (email: string) => {
    const existEmail = await this.userModel.exists({ email: email });
    if (existEmail) return true;
    return false;
  };

  //hàm tạo user
  async create(createUserDto: CreateUserDto) {
    const existEmail = await this.checkEmail(createUserDto.email);
    if (existEmail) {
      throw new BadRequestException('This email has already existed');
    }

    const hassPwd = await hashPswHelper(createUserDto.password);
    const createUser = new this.userModel({
      ...createUserDto,
      password: hassPwd,
    });
    const result = await createUser.save();
    return { message: 'create user successfully', data: result._id };
  }

  //hàm ttìm all users
  async findAll() {
    const alluser = await this.userModel.find();
    return { data: alluser };
  }

  //hàm tìm user by idd
  async findOne(_id: string) {
    return await this.userModel.findById({ _id });
  }

  async findByName(name: string) {
    const user = await this.userModel.findOne({ name: name });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  //hàm update info user
  async update(_id: string, updateUserDto: UpdateUserDto) {
    try {
      const existedUser = await this.userModel.findOne({
        name: updateUserDto.name,
      });

      if (existedUser) {
        throw new BadRequestException('This username has already existed');
      }
      const result = await this.userModel.findByIdAndUpdate(
        _id,
        updateUserDto,
        { new: true }, // trả về document sau khi update
      );

      if (!result) {
        throw new NotFoundException('User not found');
      }

      return { message: 'update user successfully', data: result.email };
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException(error);
    }
  }

  //hàm deleete user
  async remove(_id: string) {
    await this.userModel.deleteOne({ _id });
    return 'delete this user successfully';
  }

  async register(regisDto: RegisterUserDto) {
    const existEmail = await this.checkEmail(regisDto.email);
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
    return { message: 'register successfully', data: result._id };
  }

  async changeEmail(_id: string, newemail: ForgetPasswordDto) {
    const exitEmail = await this.userModel.findOne({ email: newemail.email });
    if (exitEmail) {
      throw new BadRequestException('This email has already existed');
    }
    const user = await this.userModel.findById(_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const payload = { _id: user._id, email: newemail.email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_CHANGEEMAIL_KEY'),
      expiresIn: this.configService.get('RESET_TOKEN_EXPIRED'),
    });
    const link = `http://localhost:3000/api/users/verify-email?token=${encodeURIComponent(token)}`;
    await this.mailerService
      .sendMail({
        to: newemail.email,
        subject: 'Change your email ✔',
        template: 'change-email',
        context: {
          link: link,
          name: user.name,
        },
      })
      .then(() => {})
      .catch(() => {});
    return { message: 'link sent to new email' };
  }

  async verifyNewEmail(token: string) {
    try {
      const payload: changeEmailPayload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_CHANGEEMAIL_KEY'),
      });
      if (!payload) {
        throw new BadRequestException('Invalid token');
      }
      const { _id, email } = payload;
      const user = await this.userModel.findById(_id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.email = email;
      await user.save();
      return { message: 'Email updated successfully', data: user.email };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Verify error:', error.message);
      } else {
        console.error('Verify error:', error);
      }
    }
  }
  async generate2FA(_id: string) {
    const user = await this.userModel.findById({ _id });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const secret = authenticator.generateSecret();

    // Tạo otpauth URL (Google Authenticator đọc QR này)
    const issuer = this.configService.get<string>('TWOFA_ISSUER');
    if (!issuer) {
      throw new Error('TWOFA_ISSUER environment variable is not set');
    }
    const otpauthUrl = authenticator.keyuri(
      user.email,
      issuer, // tên app
      secret,
    );

    // Convert sang QR code
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    // Lưu secret tạm cho user
    await this.userModel.findByIdAndUpdate({ _id }, { twoFAsecret: secret });
    // user.twoFAsecret = secret;
    // await user.save();

    return { qrUrl: qrCodeDataUrl, otpUrl: otpauthUrl };
  }

  // Step 2: Verify OTP khi enable 2FA
  async verify2FA(_id: string, verify2fa: Verify2faUserDto) {
    const user = await this.userModel.findById({ _id });
    if (!user || !user.twoFAsecret) {
      throw new UnauthorizedException('2FA not initialized');
    }

    const token = verify2fa.code;
    const secret = user.twoFAsecret;
    const isValid = authenticator.verify({ token, secret });
    // const checkOtp = authenticator.check(token, secret);
    // console.log('Secret:', user.twoFAsecret);
    // console.log('Client token:', token);
    // console.log('Server generate:', authenticator.generate(user.twoFAsecret));
    // console.log(checkOtp);
    console.log('Verify:', isValid);

    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Nếu đúng thì bật 2FA
    user.isTwoFAenabled = true;
    await user.save();

    return { message: '2FA enabled successfully' };
  }

  
}
