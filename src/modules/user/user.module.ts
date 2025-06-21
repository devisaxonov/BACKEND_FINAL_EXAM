import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { EmailOtpService } from '../auth/email.service';
import { AuthModule } from '../auth/auth.module';
import { OptService } from '../auth/otp.service';

@Module({
  imports:[AuthModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
