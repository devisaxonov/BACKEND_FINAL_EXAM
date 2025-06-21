import { Controller, Post, Delete, Param, Req, UseGuards, Patch } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Request } from 'express';
import AuthGuard from 'src/common/guards/auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':id/like')
  @UseGuards(AuthGuard)
  async likeComment(@Param('id') commentId: string, @Req() req: Request) {
    const userId = req['user'].id;
    return this.commentsService.toggleLike(commentId, userId, 'LIKE');
  }

  @Post(':id/dislike')
  @UseGuards(AuthGuard)
  async dislikeComment(@Param('id') commentId: string, @Req() req: Request) {
    const userId = req['user'].id;
    return this.commentsService.toggleLike(commentId, userId, 'DISLIKE');
  }

  @Delete(':id/like')
  @UseGuards(AuthGuard)
  async removeReaction(@Param('id') commentId: string, @Req() req: Request) {
    const userId = req['user'].id;
    return this.commentsService.removeReaction(commentId, userId);
  }

  @Patch(':id/pin')
  @UseGuards(AuthGuard)
  async pinComment(@Param('id') id: string,@Req() req:Request) {
    const userId = req['user'].id;
    return await this.commentsService.pinComment(id, userId);
  }
}
