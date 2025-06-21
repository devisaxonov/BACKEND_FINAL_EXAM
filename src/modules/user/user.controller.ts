import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, Put, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import AuthGuard from 'src/common/guards/auth.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService,
  ) { }

  @Get('me')
  @UseGuards(AuthGuard)
  async myProfile(@Req() req:Request) {
    const userId = req['user'].id;
    return await this.userService.myProfile(userId)

  }

  @Get('me/history')
  @UseGuards(AuthGuard)
  async getWatchHistory(
    @Req() req: Request,
    @Query('limit') limit = '20',
    @Query('page') page = '1',
  ) {
    const userId = req['user'].id;
    return this.userService.getWatchHistory(userId, +limit, +page);
  }

  @Delete('me/history')
  @UseGuards(AuthGuard)
  async clearMyHistory(@Req() req: Request) {
    const userId = req['user'].id;
    return await this.userService.clearMyHistory(userId);
  }

  @Post('send-verification-email-link')
  @UseGuards(AuthGuard)
  async sendEmailVerificationLink(@Req() req: Request) {
    const userId = req['user'].id;
    return await this.userService.sendEmailVerificationLink(userId);
  }

  @Get('verify-email')
  async verifyEmailUser(@Query('token') token: string) {
    return await this.userService.verifyEmail(token);
  }
  @Put('me')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UpdateUserDto,
  ) {
    const avatarPath = `http://localhost:3000/uploads/avatars/${file.filename}`;
    const userId = req['user'].id;
    return await this.userService.updateUserProfile(avatarPath, body, userId);
  }
}
  