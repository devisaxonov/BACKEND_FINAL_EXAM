import { Role } from "@prisma/client";
import { IsEnum, IsString } from "class-validator";

export class CreateAdminDto {
    @IsString()
    phone_number: string
    @IsString()
    email: string
    @IsString()
    username: string
    @IsString()
    firstName: string
    @IsString()
    lastName: string
}
