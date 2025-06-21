import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RedisService } from 'src/core/database/redis.service';
import { generate } from 'otp-generator';
import { SmsService } from './sms.service';
import OtpSecurityService from './otp.security.service';
import { Response } from 'express';
@Injectable()
export class OptService {
  constructor(
    private redisService: RedisService,
    private smsService: SmsService,
    private otpSecurityService: OtpSecurityService,
  ) {}

  public generateOtp() {
    const otp = generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      specialChars: false,
      upperCaseAlphabets: false,
    });
    return otp;
  }

  public getSessionToken() {
    const token = crypto.randomUUID();
    return token;
  }

  async sendOtp(phone_number: string) {
    await this.otpSecurityService.checkTempBlockedUser(phone_number);
    await this.checkOtpExisted(`user:${phone_number}`);
    const tempOtp = this.generateOtp();    
    const responseRedis = await this.redisService.setOtp(phone_number, tempOtp);    
    if (responseRedis == 'OK') {
      await this.smsService.sendSms(phone_number, tempOtp);
      return true;
    }
  }

  async checkOtpExisted(key: string) {
    const checkOtp = await this.redisService.getKey(key);    
    if (checkOtp) {
      const ttl = await this.redisService.getTTL(key);
      throw new BadRequestException(
        `Please try again later after ${ttl} seconds`,
      );
    }
  }

  async verifyOtpSendedUser(key: string, code: string, phone_number: string) {
    const otp = await this.redisService.getKey(key); 
    if (!otp) throw new BadRequestException('Invalid kod');    
    if (otp !== code) {
      const attempts =
        await this.otpSecurityService.RecordFailedOtpAttempts(phone_number);
        throw new BadRequestException({
          message: `invalid code`,
          attempts: `You have ${attempts} attempts`,
        });
    }
    await this.redisService.delKey(key);
    await this.redisService.delKey(`otp_attempts:${phone_number}`);
    const sessionToken = this.getSessionToken();
    await this.redisService.setSessionTokenUser(phone_number, sessionToken);
    return sessionToken;
  }

  async checkSessionTokenUser(key: string, token: string) {
    const sessionToken: string = await this.redisService.getKey(key);
    if (!sessionToken || sessionToken !== token)
      throw new BadRequestException('session token expired');
  }
}
