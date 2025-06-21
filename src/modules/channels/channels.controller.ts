import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import AuthGuard from 'src/common/guards/auth.guard';
import { UpdateChannelDto } from './dto/updeateChanel.dto';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get(':username/videos')
  getChannelVideos(
    @Param('username') username: string,
    @Query('limit') limit = 20,
    @Query('page') page = 1,
    @Query('sort') sort: 'newest' | 'oldest' = 'newest',
  ) {
    return this.channelsService.getChannelVideos(username, +limit, +page, sort);
  }

  @Get(':username')
  @UseGuards(AuthGuard)
  async getChannel(@Param('username') username: string, @Req() req: Request) {
    const UserId = req['user']?.id || null;
    const data = await this.channelsService.getChannelByUsername(
      username,
      UserId,
    );
    return {
      success: true,
      data,
    };
  }

  @Put('me')
  @UseGuards(AuthGuard)
  updateMyChannel(@Body() body: UpdateChannelDto, @Req() req: Request) {
    const userId = req['user'].id;
    return this.channelsService.updateMyChannel(userId, body);
  }

  @Post(':userId/subscribe')
  @UseGuards(AuthGuard)
  subscribe(@Param('userId') userId: string, @Req() req: Request) {
    return this.channelsService.subscribe(req['user'].id, userId);
  }

  @Delete(':userId/subscribe')
  @UseGuards(AuthGuard)
  unsubscribe(@Param('userId') userId: string, @Req() req: Request) {
    return this.channelsService.unsubscribe(req['user'].id, userId);
  }
}
