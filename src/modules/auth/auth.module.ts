import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OptService } from './otp.service';
import { SmsService } from './sms.service';
import OtpSecurityService from './otp.security.service';
import { EmailOtpService } from './email.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, OptService, SmsService, OtpSecurityService, EmailOtpService],
  exports:[OptService,EmailOtpService]
})
export class AuthModule {}
