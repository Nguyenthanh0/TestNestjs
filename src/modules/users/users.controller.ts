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
import { JwtUser } from 'src/authen/auth.service';
import { Roles } from 'src/authen/decorator/roleGuard';
import { RolesGuard } from 'src/authen/passport/role.guard';

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
  getMyself(@Req() req: { user: JwtUser }) {
    return this.usersService.findOne(req.user._id);
  }

  @Put('me')
  updateMyself(
    @Req() req: { user: JwtUser },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user._id, updateUserDto);
  }
}
