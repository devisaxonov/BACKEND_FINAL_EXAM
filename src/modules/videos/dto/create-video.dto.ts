import { Visibility } from "@prisma/client"

export class UploadVideoDto {
    title: string
    description?: string 
    category: string
    tags?: string[]
    visibility:Visibility
}
