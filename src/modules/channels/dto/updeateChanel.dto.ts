import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  channelName?: string;

  @IsOptional()
  @IsString()
  channelDescription?: string;

  @IsOptional()
  @IsUrl()
  channelBanner?: string;
}
