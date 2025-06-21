import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res, Query } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import AuthGuard from 'src/common/guards/auth.guard';
import { Response } from 'express';
import { AddVideoDto } from './dto/add-video.dto';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createPlaylistDto: CreatePlaylistDto, @Req() req: Request) {
    const userId = req['user'].id;
    const response = await this.playlistsService.create(createPlaylistDto, userId);
    return {
      message: "success",
      data:response
    }
  }

  async findAll(@Query() query: any,@Param('userId') authorId:string) {
    const {page,limit} = query
    return await this.playlistsService.findAll({page,limit},authorId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.playlistsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePlaylistDto: UpdatePlaylistDto) {
    return await this.playlistsService.update(id, updatePlaylistDto);
  }

  @Post(":id/videos")
  async addVideo(@Param('id') id: string,@Body() data:AddVideoDto) {
    return await this.playlistsService.addVideo(id,data)
  }

  @Delete(':id/videos/:videoId')
  async remove(@Param('id') id: string,@Param('videoId') videoId: string) {
    return await this.playlistsService.remove(id,videoId);
  }
}
