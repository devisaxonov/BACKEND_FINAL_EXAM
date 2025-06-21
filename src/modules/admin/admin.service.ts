import { BadRequestException, Injectable } from '@nestjs/common';
import PrismaService from 'src/core/database/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly db: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalVideos, totalViews, totalWatchTime, newUsersToday, newVideosToday, viewsToday] =
      await Promise.all([
        this.db.prisma.user.count(),
        this.db.prisma.video.count(),
        this.db.prisma.video.aggregate({ _sum: { viewsCount: true } }),
        this.db.prisma.watchHistory.aggregate({ _sum: { watchTime: true } }),
        this.db.prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
        this.db.prisma.video.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
        this.db.prisma.video.aggregate({
          _sum: { viewsCount: true },
          where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
        }),
      ]);

    const topCategories = await this.db.prisma.$queryRawUnsafe(
      `SELECT category, COUNT(*) FROM videos WHERE category IS NOT NULL GROUP BY category ORDER BY COUNT(*) DESC LIMIT 5`
    );

    return {
      success: true,
      data: {
        totalUsers,
        totalVideos,
        totalViews: totalViews._sum.viewsCount || 0,
        totalWatchTime: totalWatchTime._sum.watchTime || 0,
        newUsersToday,
        newVideosToday,
        viewsToday: viewsToday._sum.viewsCount || 0,
        topCategories,
        storageUsed: '500TB',
        bandwidthUsed: '50TB',
      },
    };
  }

  async getPendingVideos(limit: number, page: number) {
    const skip = (page - 1) * limit;
    const videos = await this.db.prisma.video.findMany({
      where: { status: 'PROCESSING' },
      take: limit,
      skip,
    });
    return { page, limit, data: videos };
  }

  async approveVideo(id: string) {
    await this.db.prisma.video.update({ where: { id }, data: { status: 'PUBLISHED' } });
    return { message: 'Video approved' };
  }

  async rejectVideo(id: string) {
    await this.db.prisma.video.update({ where: { id }, data: { status: 'REJECTED' } });
    return { message: 'Video rejected' };
  }

  async getUsers(limit: number, page: number, search: string, status: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      OR: [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };
    if (status === 'active') where.isBlocked = false;
    if (status === 'blocked') where.isBlocked = true;

    const users = await this.db.prisma.user.findMany({
      where,
      skip,
      take: limit,
    });
    return { page, limit, data: users };
  }

  async blockUser(id: string) {
    await this.db.prisma.user.update({ where: { id }, data: { isBlocked: true } });
    return { message: 'User blocked' };
  }

  async verifyUser(id: string) {
    await this.db.prisma.user.update({ where: { id }, data: { is_email_verified: true } });
    return { message: 'User verified' };
  }

  async createAdmin(data:CreateAdminDto) {
    const findUser = await this.db.prisma.user.findFirst({
      where: {
        phone_number: data.phone_number
      }
    });
    if (findUser) throw new BadRequestException('Phone number already exists');

    const findUserByEmail = await this.db.prisma.user.findFirst({
      where: {
        email: data.email
      }
    });
    if (findUserByEmail) throw new BadRequestException('Email already exists');
    await this.db.prisma.user.create({
      data: {
        ...data,
        role: "ADMIN",
      }
    });
    return {
      message:"Admin created successfully"
    }
  }
}
