import { Module } from '@nestjs/common';
import { VideoController } from './videos.controller';
import { VideoService } from './videos.service';

@Module({
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideosModule {}
