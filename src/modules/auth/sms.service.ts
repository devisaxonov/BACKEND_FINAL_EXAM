import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ENDPOINTS from 'src/common/constants/endpoints';
import axios from 'axios';

@Injectable()
export class SmsService {
  private email: string = process.env.ESKIZ_USER as string;
  private password: string = process.env.ESKIZ_PASSWORD as string;
  constructor() {}
async getToken(): Promise<string> {
  try {
    const url = ENDPOINTS.getEskizTokenUrl();
    const formData = new FormData();
    formData.set('email', this.email);
    formData.set('password', this.password);    
    const response = await axios.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
       }
    });
    return response.data.data.token;
  } catch (error) {
    console.error('Eskiz token olishda xatolik:', error.response?.data || error.message);
    throw new InternalServerErrorException('Eskiz token olishda xatolik');
  }
}

  async sendSms(phone_number:string,otp:string) {
    const url = ENDPOINTS.sendSmsUrl();
      const token = await this.getToken();
      const formData = new FormData();
      formData.set('mobile_phone', phone_number);
      formData.set('message', `StudyHub ilovasiga kirish kodi:${otp}`);
      formData.set('from', '4546');
      const response = await axios.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization':`Bearer ${token}`

        },
      })      
  }
}
