import { Type } from "class-transformer"
import { IsNumber, IsString } from "class-validator"

export class AddVideoDto{
    @IsString()
    videoId: string
    @IsNumber()
    @Type(()=>Number)
    position:number
}