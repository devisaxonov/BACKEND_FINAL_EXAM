import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import PrismaService from 'src/core/database/prisma.service';
import { EmailOtpService } from '../auth/email.service';

@Injectable()
export class UserService {
  constructor(
    private readonly db: PrismaService,
    private emailOtpService: EmailOtpService,
  ) {}

  async myProfile(id: string) {
    const findUser = await this.db.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        email: true,
        phone_number: true,
        username: true,
        subscribersCount: true,
        totalViews: true,
      },
    });
    return findUser;
  }

  async getWatchHistory(userId: string, limit: number, page: number) {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const histories = await this.db.prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: 'desc' },
      take,
      skip,
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            videoUrl: true,
            duration: true,
            viewsCount: true,
            createdAt: true,
          },
        },
      },
    });
    return {
      page,
      limit: take,
      total: histories.length,
      data: histories.map((h) => ({
        watchedAt: h.watchedAt,
        watchTime: h.watchTime,
        video: {
          ...h.video,
          videoUrl: `http://${process.env.DOMEN_NAME}:${process.env.PORT}/api/videos/watch/video/${h.video.videoUrl}`,
          thumbnail: `http://${process.env.DOMEN_NAME}:${process.env.PORT}/api/thumbnails/${h.video.thumbnail}`,
        },
      })),
    };
  }

  async clearMyHistory(userId: string) {
    await this.db.prisma.watchHistory.deleteMany({
      where: {
        userId,
      },
    });
    return {
      message: 'Watch history cleared successfully',
    };
  }

  async sendEmailVerificationLink(id: string) {
    const userEmail = await this.db.prisma.user.findUnique({
      where: {
        id
      },
      select: {
        email: true
      }
    });
    
    await this.emailOtpService.sendEmailLink(userEmail!.email);
    
    return { message: 'link sended' };
  }

  async verifyEmail(token: string) {
    const data = await this.emailOtpService.getEmailToken(token);
    const email = JSON.parse(data as string).email;
    const user = await this.db.prisma.user.findFirst({
      where: { email },
    });
    await this.db.prisma.user.update({
      where: { id: user?.id },
      data: { is_email_verified: true },
    });
    return {
      message:'Email verified successfully'
    }
  }

  async updateUserProfile(
    avatarPath: string,
    userData: UpdateUserDto,
    id: string,
  ) {
    const findUser = await this.db.prisma.user.findFirst({
      where: { id },
    });
    if (!findUser) throw new NotFoundException('User not found');
    if (userData.email) {
      const checkEmail = await this.db.prisma.user.findFirst({
        where: { email: userData.email },
      });
      if (checkEmail && checkEmail.id !== findUser.id)
        throw new ConflictException('This email already existed!');
    }
    if (userData.username) {
      const checkUsername = await this.db.prisma.user.findFirst({
        where: { username: userData.username },
      });
      if (checkUsername && checkUsername.id !== findUser.id)
        throw new ConflictException('This username already existed!');
    }
    if (userData.phone_number) {
      const checkPhone = await this.db.prisma.user.findFirst({
        where: { phone_number: userData.phone_number },
      });
      if (checkPhone && checkPhone.id !== findUser.id)
        throw new ConflictException('This email already existed!');
    }

    const updatedUser = await this.db.prisma.user.update({
      where: { id },
      data: { ...userData, avatar: avatarPath },
    });
    
    return updatedUser;
  }
}

