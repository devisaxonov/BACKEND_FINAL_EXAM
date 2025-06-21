import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import PrismaService from 'src/core/database/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateChannelDto } from './dto/updeateChanel.dto';

@Injectable()
export class ChannelsService {
  constructor(private readonly db: PrismaService) {}

  async getChannelVideos(
    username: string,
    limit: number,
    page: number,
    sort: 'newest' | 'oldest',
  ) {
    const user = await this.db.prisma.user.findUnique({
      where: { username },
    });
    if (!user) throw new NotFoundException('Channel topilmadi');

    const orderBy: Prisma.VideoOrderByWithRelationInput =
      sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const videos = await this.db.prisma.video.findMany({
      where: { authorId: user.id },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return videos;
  }

  async getChannelByUsername(username: string, UserId: string | null) {
    const user = await this.db.prisma.user.findUnique({
      where: { username },
      include: {
        videos: {
          select: { id: true },
        },
      },
    });

    if (!user) throw new NotFoundException('Kanal topilmadi');

    let isSubscribed = false;
    if (UserId && UserId !== user.id) {
      const subscription = await this.db.prisma.subscription.findUnique({
        where: {
          subscriberId_channelId: {
            subscriberId: UserId,
            channelId: user.id,
          },
        },
      });
      isSubscribed = !!subscription;
    }

    return {
      id: user.id,
      username: user.username,
      channelName: `${user.firstName} ${user.lastName}`,
      channelDescription: user.channelDescription,
      avatar: user.avatar,
      channelBanner: user.channelBanner,
      subscribersCount: user.subscribersCount,
      totalViews: Number(user.totalViews),
      videosCount: user.videos.length,
      joinedAt: user.createdAt,
      isVerified: user.is_email_verified || user.is_phone_verified,
      isSubscribed,
    };
  }

  async updateMyChannel(userId: string, dto: UpdateChannelDto) {
    const user = await this.db.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const [firstName, ...lastName] = (
      dto.channelName || `${user.firstName} ${user.lastName}`
    ).split(' ');

    return this.db.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName: lastName.join(' '),
        channelDescription: dto.channelDescription,
        channelBanner: dto.channelBanner,
      },
    });
  }
  async subscribe(subscriberId: string, channelId: string) {
    if (subscriberId === channelId)
      throw new BadRequestException("O'z kanaliga obuna bo'lish mumkin emas");

    return this.db.prisma.subscription.upsert({
      where: {
        subscriberId_channelId: { subscriberId, channelId },
      },
      update: {},
      create: {
        subscriberId,
        channelId,
      },
    });
  }

  async unsubscribe(subscriberId: string, channelId: string) {
    try {
      return await this.db.prisma.subscription.delete({
        where: {
          subscriberId_channelId: { subscriberId, channelId },
        },
      });
    } catch (e) {
      throw new NotFoundException('Obuna topilmadi');
    }
  }
}
