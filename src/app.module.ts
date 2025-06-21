import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoreModule } from './core/core.module';
import { SeederModule } from './core/database/seeders/seeder.module';
import { VideosModule } from './modules/videos/videos.module';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { FfmpegModule } from './core/ffmpeg/ffmpeg.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    CoreModule,
    SeederModule,
    VideosModule,
    PlaylistsModule,
    CommentsModule,
    ChannelsModule,
    FfmpegModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
    }),
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
