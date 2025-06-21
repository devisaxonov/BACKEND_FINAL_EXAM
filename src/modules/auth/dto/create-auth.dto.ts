import { IsEmail, IsString } from "class-validator"

export class SendOtpDto {
    @IsString()
    phone_number: string
}

export class RegisterDto{
    @IsString()
    session_token: string
    @IsEmail()
    email: string
    @IsString()
    phone_number: string
    @IsString()
    username: string
    @IsString()
    firstName: string
    @IsString()
    lastName: string
};