import { IsNotEmpty } from 'class-validator';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { hashPswHelper } from 'src/ulti/helper';
import { RegisterUserDto } from 'src/modules/authen/dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtUser } from '../authen/auth.service';
import { ForgetPasswordDto } from '../authen/dto/forget-password.dto';

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

      return { message: 'update user successfully', data: result };
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
}
