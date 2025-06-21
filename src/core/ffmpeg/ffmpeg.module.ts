import { Global, Module } from "@nestjs/common";
import FFmpegService from "./video.service";

@Global()
@Module({
    providers: [FFmpegService],
    exports:[FFmpegService]
})
export class FfmpegModule{}