import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/modules/authen/auth.service';
import { ForgetPasswordDto } from '../authen/dto/forget-password.dto';
import { Public } from 'src/common/decorator/customizeGuard';
import { Verify2faUserDto } from './dto/verify2fa.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/adminUpsteUser.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // endpoints for USER

  @Get('user')
  getMe(@Req() req: { user: JwtUser }) {
    return this.usersService.findOne(req.user._id);
  }

  @Put('user')
  updateMe(
    @Req() req: { user: JwtUser },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user._id, updateUserDto);
  }

  @Post('change-email')
  changeEmail(
    @Req() req: { user: JwtUser },
    @Body() changeEmailDto: ForgetPasswordDto,
  ) {
    const _id = req.user._id;
    return this.usersService.changeEmail(_id, changeEmailDto);
  }

  @Public()
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.usersService.verifyNewEmail(token);
  }

  @Post('generate/2fa')
  turnOn2TA(@Req() req: { user: JwtUser }) {
    const user = req.user;
    return this.usersService.generate2FA(user._id);
  }

  @Post('verify/2fa')
  verifyOtp(
    @Req() req: { user: JwtUser },
    @Body() verify2fa: Verify2faUserDto,
  ) {
    const user = req.user;
    return this.usersService.verify2FA(user._id, verify2fa);
  }

  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: JwtUser },
  ) {
    return this.usersService.uploadAvatar(file, req.user._id);
  }
}
