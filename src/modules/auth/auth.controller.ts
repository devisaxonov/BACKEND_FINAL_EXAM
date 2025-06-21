import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, SendOtpDto } from './dto/create-auth.dto';
import { Response } from 'express';
import { verifyOtpDto } from './dto/verify';
import { LoginDto } from './dto/login.dto';
import axios from 'axios';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/send-otp')
  async sendOtpUser(@Body() data: SendOtpDto) {
    const response = await this.authService.sendOtpUser(data);
    return response;
  }

  @Post('login')
  async login(@Body() data: LoginDto) {
    const response = await this.authService.sendOtpUser(data);
    return response;
  }

  @Post('login/verify-otp')
  async loginVerify(
    @Body() data: verifyOtpDto,
    @Res() response: Response,
  ) {
    
    const res = await this.authService.verifyOtp(data);
    const { token } = res;
    if (token) {
      response.cookie('token', token, {
        maxAge: 1 * 3600 * 1000,
        httpOnly: true,
      });
      
    }
    return token ? response.json({token}):res
  }

  @Post('register/verify-otp')
  async verifyOtp(
    @Body() data: verifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const res = await this.authService.verifyOtp(data);
    const { token } = res;
    if (token) {
      response.cookie('token', token, {
        maxAge: 1 * 3600 * 1000,
        httpOnly: true,
      });
      
    }
    return token ? response.json({token}):res
  }

  @Post('register')
  async register(
    @Body() data: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req:Request
  ) {
    const ip = req.headers['x-forwarded-for']
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    const token = await this.authService.register(data,response.data.country_code);
    res.cookie('token', token, {
      maxAge: 1 * 3600 * 1000,
      httpOnly: true,
    });
    return {token}
  }
}
