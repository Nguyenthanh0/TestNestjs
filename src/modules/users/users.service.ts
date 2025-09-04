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
import { RegisterUserDto } from 'src/authService/dto/register.dtoi';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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
      const result = await this.userModel.findByIdAndUpdate(
        _id,
        { $set: updateUserDto },
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

    const hassPwd = await hashPswHelper(regisDto.password);
    const createUser = new this.userModel({
      ...regisDto,
      password: hassPwd,
      isActive: false,
      codeId: uuidv4(),
      codeExpired: dayjs().add(1, 'day'),
    });
    const result = await createUser.save();
    return { message: 'register successfully', data: result._id };
  }
}
