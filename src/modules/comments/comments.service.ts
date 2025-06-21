import { Injectable, NotFoundException } from '@nestjs/common';
import PrismaService from 'src/core/database/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly db: PrismaService) {}

  async toggleLike(commentId: string, userId: string, type: 'LIKE' | 'DISLIKE') {
    const existing = await this.db.prisma.like.findUnique({
      where: {
        userId_commentId_type: {
          userId,
          commentId,
          type
        }
      }
    });

    const oppositeType = type === 'LIKE' ? 'DISLIKE' : 'LIKE';
    const opposite = await this.db.prisma.like.findUnique({
      where: {
        userId_commentId_type: {
          userId,
          commentId,
          type: oppositeType
        }
      }
    });

    if (opposite) {
      await this.db.prisma.like.delete({
        where: {
          userId_commentId_type: {
            userId,
            commentId,
            type: oppositeType
          }
        }
      });

      await this.db.prisma.comment.update({
        where: { id: commentId },
        data: {
          [oppositeType === 'LIKE' ? 'likesCount' : 'dislikesCount']: {
            decrement: 1
          }
        }
      });
    }

    if (existing) {
      await this.db.prisma.like.delete({
        where: {
          userId_commentId_type: {
            userId,
            commentId,
            type
          }
        }
      });

      await this.db.prisma.comment.update({
        where: { id: commentId },
        data: {
          [type === 'LIKE' ? 'likesCount' : 'dislikesCount']: {
            decrement: 1
          }
        }
      });

      return { message: `${type} removed` };
    }

    await this.db.prisma.like.create({
      data: {
        userId,
        commentId,
        type
      }
    });

    await this.db.prisma.comment.update({
      where: { id: commentId },
      data: {
        [type === 'LIKE' ? 'likesCount' : 'dislikesCount']: {
          increment: 1
        }
      }
    });

    return { message: `${type} added` };
  }

  async removeReaction(commentId: string, userId: string) {
    const existing = await this.db.prisma.like.findFirst({
      where: {
        userId,
        commentId
      }
    });

    if (!existing) {
      return { message: 'No like/dislike to remove' };
    }

    await this.db.prisma.like.delete({
      where: {
        userId_commentId_type: {
          userId,
          commentId,
          type: existing.type
        }
      }
    });

    await this.db.prisma.comment.update({
      where: { id: commentId },
      data: {
        [existing.type === 'LIKE' ? 'likesCount' : 'dislikesCount']: {
          decrement: 1
        }
      }
    });

    return { message: `${existing.type} removed` };
  }

  async pinComment(commentId: string, userId: string) {
    const findComment = await this.db.prisma.comment.findFirst({
      where: {
        id: commentId
      },
      select: {
        video: {
          select: {
            authorId: true
          }
        }
      }
    });
    if (!findComment || findComment.video.authorId !== userId) throw new NotFoundException('NOt FOUND');
    await this.db.prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        isPinned:true
      }
    })

    return {
      message: "Muvaffaqiyatli pin qilindi"
    }
  }
}
