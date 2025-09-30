import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/common/decorator/roleGuard';
import { RolesGuard } from 'src/common/passport/role.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminUpdateUserDto } from './dto/adminUpsteUser.dto';

@UseGuards(RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('by-id/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('by-name')
  findByName(@Query('name') name: string) {
    return this.usersService.findByName(name);
  }

  @Put('by-id/:id')
  update(@Param('id') id: string, @Body() updateUserDto: AdminUpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete('by-id/:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
