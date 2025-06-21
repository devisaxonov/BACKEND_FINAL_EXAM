import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterDto, SendOtpDto } from './dto/create-auth.dto';
import { verifyOtpDto } from './dto/verify';
import PrismaService from 'src/core/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/core/database/redis.service';
import { OptService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private db: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
    private otpService: OptService,
  ) {}
  async sendOtpUser(data: SendOtpDto) {
    const res = await this.otpService.sendOtp(data.phone_number);
    if (!res) throw new InternalServerErrorException('server error');
    return {
      message: 'code sended',
    };
  }

  async verifyOtp(data: verifyOtpDto) {
    const findUser = await this.db.prisma.user.findFirst({
        where: {
          phone_number: data.phone_number,
        },
    });      
    const key = `user:${data.phone_number}`;
    const sessionToken = await this.otpService.verifyOtpSendedUser(key, data.code, data.phone_number);

    if (findUser) {
      const token = this.jwt.sign({ id: findUser.id,role:findUser.role });
      return {
        token
      }
    }
    
    return {
      message: 'success',
      status: 200,
      session_token: sessionToken
    };
  }

  async register(data: RegisterDto,region:string) {
      const findUser = await this.db.prisma.user.findFirst({
      where: {
        phone_number: data.phone_number,
      },
    });

    if (findUser) throw new ConflictException('Phone number already exists!');
    
    const findUserByEmail = await this.db.prisma.user.findUnique({
      where: {
        email: data.email
      }
    });

    if (findUserByEmail) throw new ConflictException('Email already exists!');

    const key = `sessionToken:${data.phone_number}`
    await this.otpService.checkSessionTokenUser(key, data.session_token);

    const user = await this.db.prisma.user.create({
      data: {
        ...data,
        region,
      }
    });

    const token = this.jwt.sign({ id: user.id,role:user.role });
    await this.redis.delKey(key);

    return token 
  }
}
