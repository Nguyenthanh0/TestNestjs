import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtUser } from 'src/modules/authen/auth.service';
import { RolesGuard } from 'src/common/passport/role.guard';
import { ForgetPasswordDto } from '../authen/dto/forget-password.dto';
import { Roles } from 'src/common/decorator/roleGuard';
import { Public } from 'src/common/decorator/customizeGuard';
import { Verify2faUserDto } from './dto/verify2fa.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // endpoints for ADMIN
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('by-id/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('by-name')
  findByName(@Query('name') name: string) {
    return this.usersService.findByName(name);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Put('by-id/:id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete('by-id/:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // endpoints for USER

  @Get('me')
  getMe(@Req() req: { user: JwtUser }) {
    return this.usersService.findOne(req.user._id);
  }

  @Put('me')
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
}
