import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import FFmpegService from 'src/core/ffmpeg/video.service';
import { UploadVideoDto } from './dto/create-video.dto';
import PrismaService from 'src/core/database/prisma.service';
import { UpdateVideoDto } from './dto/update-video.dto';
import { promises as fsf } from 'fs';import { Prisma } from '@prisma/client';
@Injectable()
export class VideoService {
  constructor(
    private ffmpegService: FFmpegService,
    private readonly db: PrismaService,
  ) {}
  async uploadVideo(
    video: Express.Multer.File,
    thumbnails: any,
    data: UploadVideoDto,
    duration: number,
    authorId: string,
  ) {
    const fileName = video.filename;
    const videoPath = path.join(process.cwd(), 'uploads', 'videos', fileName);
    const resolution: any =
      await this.ffmpegService.getVideoResolution(videoPath);
    const resolutions = [
      { height: 240 },
      { height: 360 },
      { height: 480 },
      { height: 720 },
      { height: 1080 },
    ];

    const validResolutions = resolutions.filter(
      (r) => r.height <= resolution.height + 6,
    );

    if (validResolutions.length > 0) {
      fs.mkdir(
        path.join(process.cwd(), 'uploads', 'videos', fileName.split('.')[0]),
        {
          recursive: true,
        },
        (err) => {
          if (err) throw new InternalServerErrorException(err);
        },
      );

      await Promise.all(
        this.ffmpegService.convertToResolutions(
          videoPath,
          path.join(process.cwd(), 'uploads', 'videos', fileName.split('.')[0]),
          validResolutions,
        ),
      );
      fs.unlinkSync(videoPath);
      
      await this.db.prisma.video.create({
        data: {
          id: video.filename.split('.')[0],
          videoUrl: video.filename.split('.')[0],
          duration,
          thumbnail:thumbnails.filename,
          ...data,
          authorId,
          
        },
      });
      return {
        message: 'success',
      };
    } else {
      console.log(' Video juda past sifatli, convert qilish kerak emas.');
    }
  }
  async watchVideo(id: string, quality: string, range: string, res: Response) {
    const fileName = id;
    const baseQuality = `${quality}.mp4`;
    const basePath = path.join(process.cwd(), 'uploads', 'videos');
    const readDir = fs.readdirSync(basePath);
    const videoActivePath = path.join(basePath, fileName, baseQuality);
    if (!readDir.includes(fileName))
      throw new NotFoundException('video not found');
    const innerVideoDir = fs.readdirSync(path.join(basePath, fileName));
    if (!innerVideoDir.includes(baseQuality))
      throw new NotFoundException('video quality not found');
    const { size } = fs.statSync(videoActivePath);
    if (!range) {
      range = `bytes=0-1048575`;
    }

    const { start, end, chunkSize } = this.ffmpegService.getChunkProps(
      range,
      size,
    );
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });
    const videoStream = fs.createReadStream(videoActivePath, {
      start,
      end,
    });
    let bytes = 0;
    videoStream.on('data', (data) => {
      bytes += data.length / 1024;
    });
    videoStream.on('end', () => {
      console.log(bytes);
    });
    videoStream.on('error', (err) => {
      console.log(err);
    });
    videoStream.pipe(res);
  }

  async videoDetails(videoId: string) {
    const findVideo = await this.db.prisma.video.findUnique({
      where: {
        id: videoId
      },
      select: {
        id: true
      }
    });
    if (!findVideo) throw new NotFoundException("Video not found");
    const result: any = await this.db.prisma.$queryRawUnsafe(
          `
      SELECT
        v.id,
        v.title,
        v.description,
        v.thumbnail,
        v."videoUrl",
        v.duration,
        v."viewsCount",
        v."likesCount",
        v."dislikesCount",
        v."commentsCount",
        v."createdAt",

        json_build_object(
          'id', u.id,
          'username', u.username,
          'channelName', u."firstName" || ' ' || u."lastName",
          'avatar', u.avatar,
          'subscribersCount', u."subscribersCount",
          'isVerified', u."is_email_verified"
        ) AS author

      FROM "videos" v
      JOIN "users" u ON v."authorId" = u.id
      WHERE v.id = $1
    `,
          videoId,
        );
    return JSON.parse(
      JSON.stringify(result[0], (_, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
    );
  }

  async updateVideo(videoId: string, data: UpdateVideoDto, authorId: string) {
    const findVideo = await this.db.prisma.video.findUnique({
      where: {
        id:videoId
      }
    })
    if (!findVideo) throw new NotFoundException("Video not found");
    if (authorId !== findVideo.authorId) throw new ForbiddenException('Forbidden resources');
    await this.db.prisma.video.update({
      where: {
          id:videoId
      },
      data
    })
    return {
      message:'video updated successfully'
    }
  }

  async deleteVideo(authorId: string, videoId: string) {
    const findVideo = await this.db.prisma.video.findUnique({
      where: {
        id: videoId
      }
    });
    if (!findVideo) throw new NotFoundException("Video not found");
    if (authorId !== findVideo.authorId) throw new ForbiddenException('Forbidden resources');
    const videoPath = path.join(process.cwd(), 'uploads', 'videos', findVideo.videoUrl);
    const thumbnail = path.join(process.cwd(), 'uploads', 'thumbnails', findVideo.thumbnail as string);

    if (fs.existsSync(videoPath)) {
      await fsf.rm(videoPath, { recursive: true, force: true });
    } else {
      console.warn('Fayl mavjud emas:',videoPath);
    }
    if (fs.existsSync(thumbnail)) {
      fs.unlinkSync(thumbnail);
    } else {
      console.warn('Fayl mavjud emas:',thumbnail);
    }
    await this.db.prisma.video.delete({
      where: {
        id: videoId
      }
    });
    return {
      message: "video deleted successfully"
    };
  }

}
