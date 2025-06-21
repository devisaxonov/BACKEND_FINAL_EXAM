import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
@Injectable()
export class RedisService{
    public redis: Redis;
    private duration:number = 60;
    constructor() {
        this.redis = new Redis({
            port: +(process.env.REDIS_PORT as string),
            host: process.env.REDIS_HOST as string
        });
        this.redis.on('connect', () => {
            console.log('Redis connected');
        })
        this.redis.on('error', (err) => {
            console.log('Redis connecting error',err);
            this.redis.quit();
            process.exit(1)
        })
    }

    async setOtp(phone_number:string,otp:string) {
        const key = `user:${phone_number}`;
        const res = await this.redis.setex(key, this.duration, otp);
        return res
    }

    async getKey(key: string):Promise<string> {
        const otp = await this.redis.get(key) as string;
        return otp
        
    }

    async getTTL(key:string) {
        const ttl = await this.redis.ttl(key);
        return ttl
    }

    async delKey(key: string) {
        await this.redis.del(key)
        return;
    }

    async setSessionTokenUser(phone_number: string,token:string) {
        const key = `sessionToken:${phone_number}`
        const res = await this.redis.setex(key, 300, token);
        return res
    }
}