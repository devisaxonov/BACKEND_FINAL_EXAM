import { Visibility } from "@prisma/client";
import { IsEnum, IsString } from "class-validator";

export class CreatePlaylistDto {
    @IsString()
    title: string
    @IsString()
    description: string
    @IsEnum(Visibility)
    visibility:Visibility
}
