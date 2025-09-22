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

@Controller('users')
export class AdminController {
  constructor(private readonly usersService: UsersService) {}
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
  update(@Param('id') id: string, @Body() updateUserDto: AdminUpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete('by-id/:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
