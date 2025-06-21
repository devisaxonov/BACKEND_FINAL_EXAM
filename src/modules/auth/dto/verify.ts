import { IsString } from "class-validator"

export class verifyOtpDto {
  @IsString()
  phone_number: string
  @IsString()
  code: string
}
