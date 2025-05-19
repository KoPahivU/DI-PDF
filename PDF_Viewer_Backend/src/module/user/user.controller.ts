import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';
import { Public } from '@/common/decorator/customize';
import { SearchFileDto } from './dto/search-file.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @Public()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('profile')
  async getProfile(@Request() req) {
    return await this.userService.getProfile(req.user._id);
  }

  @Post('search-user')
  async searchUser(@Body() search: SearchFileDto, @Query() paginationDto: PaginationDto) {
    return await this.userService.searchUser(search, paginationDto);
  }
}
