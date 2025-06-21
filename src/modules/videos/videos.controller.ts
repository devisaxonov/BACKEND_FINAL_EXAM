import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path, { extname } from 'path';
import { Request, Response } from 'express';
import { VideoService } from './videos.service';
import { UploadVideoDto } from './dto/create-video.dto';
import { v4 as uuid } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import AuthGuard from 'src/common/guards/auth.guard';
import { UpdateVideoDto } from './dto/update-video.dto';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            if (file.fieldname === 'video') {
              cb(null, './uploads/videos');
            } else if (file.fieldname === 'thumbnail') {
              cb(null, './uploads/thumbnails');
            }
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = uuid();
            cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  async uploadVideo(
    @UploadedFiles()
    files: {
      video: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
    @Body() data: UploadVideoDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const videoPath = files.video[0].path;
    const duration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format.duration || 0);
        }
      });
    });
    const authorId = req['user'].id;
    return await this.videoService.uploadVideo(
      files.video[0],
      files.thumbnail ? files.thumbnail[0] : null,
      data,
      +duration.toFixed(2),
      authorId,
    );
  }

  @Get('watch/video/:id')
  async watchVideo(
    @Param('id') id: string,
    @Query('quality') quality = '360p',
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const param = id;
    const contentRange = req.headers.range;
    await this.videoService.watchVideo(
      param,
      quality,
      contentRange as string,
      res,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async videoDetails(@Param('id') id: string) {
    const data = await this.videoService.videoDetails(id);
    const videoUrl = `http://${process.env.DOMEN_NAME}:${process.env.PORT}/api/videos/watch/video/${data.videoUrl}`;
    const thumbnail = `http://${process.env.DOMEN_NAME}:${process.env.PORT}/api/thumbnails/${data.thumbnail}`
    return {
      ...data,
      videoUrl,
      thumbnail
    }
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateVideo(
    @Param('id') id: string,
    @Body() data: UpdateVideoDto,
    @Req() req:Request
  ) {
    const userId = req['user'].id;
    return await this.videoService.updateVideo(id, data, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteVideo(@Param('id') id: string, @Req() req: Request) {
    const userId = req['user'].id;
    return await this.videoService.deleteVideo(userId, id);
  }

  
}
