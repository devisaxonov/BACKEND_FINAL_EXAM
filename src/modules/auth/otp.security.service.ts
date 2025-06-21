import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from 'src/core/database/redis.service';

@Injectable()
class OtpSecurityService {
  private maxAttemptsOtp: number = 3;
  private blockedDuration: number = 3600;
  private otpAttemptsDuration: number = 1800;
  constructor(private redisService: RedisService) {}
  async RecordFailedOtpAttempts(phone_number: string) {
    const key = `otp_attempts:${phone_number}`;
    const checkExistsKey = await this.redisService.redis.exists(key);
    if (checkExistsKey) {
      await this.redisService.redis.incr(key);
      await this.redisService.redis.expire(key, this.otpAttemptsDuration);
    } else {
      await this.redisService.redis.incr(key);
    }
    const attempts = +((await this.redisService.getKey(key)) as string);
    const res = this.maxAttemptsOtp - attempts;
    if (res === 0) this.temporaryBlockedUser(phone_number, attempts);
    return res;
  }

  async temporaryBlockedUser(phone_number: string, attempts: number) {
    const key = `temporary_blocked_user:${phone_number}`;
    const data = Date.now();
    await this.redisService.redis.setex(
      key,
      this.blockedDuration,
      JSON.stringify({
        blockedAt: data,
        attempts,
        reason: 'To many attempts',
        unBlockedAt: data + this.blockedDuration * 1000,
      }),
    );
    await this.deleteAttempts(`otp_attempts:${phone_number}`);
  }

  async checkTempBlockedUser(phone_number: string) {
    const key = `temporary_blocked_user:${phone_number}`;
    const data = await this.redisService.getKey(key);
    if (data) {
      const ttl = await this.redisService.getTTL(key);
      throw new BadRequestException({
        message: `You tried to much Please try again after ${ttl} seconds`,
      });
    }
  }

  async deleteAttempts(key: string) {
    await this.redisService.delKey(key);
  }
}

export default OtpSecurityService;
