import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { ForgetPasswordDto } from '../authen/dto/forget-password.dto';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { Verify2faUserDto } from './dto/verify2fa.dto';
import { AdminUpdateUserDto } from './dto/adminUpsteUser.dto';
import { Client } from 'minio';
import sharp from 'sharp';

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
    @Inject('MINIO_CLIENT') private readonly minioClient: Client,
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

  //hàm admin update info user
  async updateUser(_id: string, updateUserDto: AdminUpdateUserDto) {
    try {
      const existedEmail = await this.userModel.findOne({
        email: updateUserDto.email,
      });
      const existedUser = await this.userModel.findOne({
        name: updateUserDto.name,
      });

      if (existedUser || existedEmail) {
        throw new BadRequestException('Email or user name has already existed');
      }
      const user = await this.userModel.findById(_id);
      if (!user) throw new NotFoundException('User not found');

      const hashPassword = await hashPswHelper(updateUserDto.password);
      updateUserDto.password = hashPassword;

      await this.userModel.findByIdAndUpdate(user._id, updateUserDto, {
        new: true,
      });

      return { message: 'update user successfully', data: user.email };
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException(error);
    }
  }

  //hàm user update info
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
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Nếu đúng thì bật 2FA
    user.isTwoFAenabled = true;
    await user.save();

    return { message: '2FA enabled successfully' };
  }
  private readonly bucketName = 'user-avatars';

  async uploadAvatar(file: Express.Multer.File, _id: string) {
    if (!file) {
      throw new HttpException('File không tồn tại', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findById(_id);
    if (!user) {
      throw new BadRequestException('user not fond');
    }

    //check xem user đã có avatar chưa, nếu đổi avatar thì xoá avatar cũ
    if (user.avatar) {
      const oldFilename = user.avatar.split('/').pop();
      if (!oldFilename) throw new NotFoundException('old fileName not found');
      try {
        await this.minioClient.removeObject(this.bucketName, oldFilename);
      } catch (error) {
        throw new BadRequestException('delete old avatar unsuccessfully');
      }
    }

    // Kiểm tra bucket, nếu chưa có thì tạo
    const isBucketExist = await this.minioClient.bucketExists(this.bucketName);
    if (!isBucketExist) {
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
    }

    //nén ảnh, giảm dung lượng của ảnh
    const resizedBuffer = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' }) // scale về 300x300
      .jpeg({ quality: 80 }) // nén về jpeg chất lượng 80%
      .toBuffer();

    // Tạo tên file duy nhất
    const fileName = `${_id}-${Date.now()}-${file.originalname}`;

    // Upload file lên MinIO
    await this.minioClient.putObject(
      this.bucketName,
      fileName,
      resizedBuffer,
      resizedBuffer.length,
      { 'Content-Type': file.mimetype },
    );

    // Tạo file Url => db
    const fileUrl = `${this.configService.get<string>('MINIO_ENDPOINT')}:${this.configService.get<string>('MINIO_PORT')}/${this.bucketName}/${fileName}`;

    await this.userModel.findByIdAndUpdate(_id, { avatar: fileUrl });

    return { message: 'upload avatar successfully', url: fileUrl };
  }
}
