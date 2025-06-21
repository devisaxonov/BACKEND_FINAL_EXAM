import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PrismaService from '../prisma.service';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    private readonly db: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async seedUsers() {
    const phone_number = this.configService.get('SUPERADMIN_PHONE_NUMBER');

    const findUser = await this.db.prisma.user.findFirst({
      where: {
        phone_number,
      },
    });
    if (!findUser) {
      await this.db.prisma.user.create({
        data: {
          username: 'SUPERADMIN',
          firstName: '',
          lastName: '',
          phone_number,
          email: 'xushnidbekisaxonov@gmail.com',
          role: 'SUPERADMIN',
        },
      });
    }
    return true;
  }

  async onModuleInit() {
    try {
      await this.seedUsers();
    } catch (error) {
      console.log(error);
    }
  }
}
