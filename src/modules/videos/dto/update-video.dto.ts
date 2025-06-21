import { PartialType } from '@nestjs/mapped-types';
import { UpdateUserDto } from 'src/modules/user/dto/update-user.dto';
import { UploadVideoDto } from './create-video.dto';

export class UpdateVideoDto extends PartialType(UploadVideoDto) {}
