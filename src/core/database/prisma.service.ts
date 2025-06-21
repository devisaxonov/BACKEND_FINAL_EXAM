import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export default class PrismaService implements OnModuleInit, OnModuleDestroy{
    public prisma: PrismaClient;
    constructor() {
        this.prisma = new PrismaClient();
    }
    onModuleInit() {
        this.prisma.$connect()
    }
    onModuleDestroy() {
        this.prisma.$disconnect()
    }
}