import { DynamicModule, Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ServeStaticModule } from "@nestjs/serve-static";
import path from 'path'
@Module({
    imports: [
        DatabaseModule,
        ConfigModule.forRoot({
            envFilePath: '.env',
            isGlobal:true
        }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            global: true,
            useFactory: (configService:ConfigService) => ({
                secret: configService.get("JWT_KEY"),
                signOptions: {
                    expiresIn: '1h'
                }
            }),
            inject:[ConfigService]
        }),
        // ResendModule.forRootAsync({
        //     imports: [ConfigModule],
        //     useFactory: async (configService:ConfigService) => ({
        //         apiKey: configService.get('RESEND_API_KEY') as string
        //     }),
        //     inject:[ConfigService]
        // }) as DynamicModule
    ],
    exports:[]
})

export class CoreModule{}