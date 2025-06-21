import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import PrismaService from 'src/core/database/prisma.service';
import { QueryDto } from './dto/find-playlist.dto';
import { AddVideoDto } from './dto/add-video.dto';

@Injectable()
export class PlaylistsService {
  constructor(private readonly db:PrismaService){}
  async create(createPlaylistDto: CreatePlaylistDto,authorId:string) {
    return await this.db.prisma.playlist.create({
      data: {
        ...createPlaylistDto,
        authorId
      },
      select: {
        id: true,
        title: true,
        description: true,
        visibility: true,
        author: {
          select: {
            firstName: true,
            lastName:true
          }
        }
      }
    });
  }


  async findOne(id: string) {
    const findPlayList = await this.db.prisma.playlist.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        title: true,
        description: true,
        visibility: true,
        videos: {
          select: {
            id: true,
            video: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                videoUrl: true,
                author: {
                  select: {
                    firstName: true,
                    lastName:true
                  }
                }
              }
            }
          }
        }
      }
    }); 
    if (!findPlayList) throw new NotFoundException("Bu idda playlist mavjud emas");
    return findPlayList
  }

 async findAll({ page, limit}:QueryDto,authorId:string ) {
  const offset = page ? (page - 1) * limit : page;

  const playlists = await this.db.prisma.playlist.findMany({
      where:{authorId},
      skip: offset,
    take: limit,
    select: {
      id: true,
      title: true,
      description: true, 
      visibility: true,
      videos: {
          select: {
            id: true,
            video: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                videoUrl: true,
                author: {
                  select: {
                    firstName: true,
                    lastName:true
                  }
                }
              }
            }
          }
        }
      }
    });

   const total = await this.db.prisma.playlist.count({
     where: {
      authorId
    }});
    const pages = Math.ceil(total / limit);

    return {
      playlists,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }



  async update(id: string, updatePlaylistDto: UpdatePlaylistDto) {
    return await this.db.prisma.playlist.update({
      where: {
        id
      },
      data: {
        ...updatePlaylistDto
      },
      select: {
        id: true,
        title: true,
        description: true,
        visibility:true
      }
    });
  }

  async addVideo(id: string, addVideoDto: AddVideoDto) {
    const position = await this.db.prisma.playlistVideo.findFirst({
      where: {
        position:addVideoDto.position
      }
    })

    if (position) throw new BadRequestException('Bu position band');

    return await this.db.prisma.playlistVideo.create({
      data: {
        playlistId: id,
        ...addVideoDto,
      },
      select: {
        id: true,
        position: true,
        playlist: {
          select: {
            id: true,
            title:true
          }
        }
      }
    })
  }

async remove(id: string, videoId: string) {
  const findVideo = await this.db.prisma.playlistVideo.findFirst({
    where: {
      playlistId: id,
      videoId: videoId
    }
  });

  if (!findVideo) {
    throw new NotFoundException('BU manzilda video topilmadi');
  }

  await this.db.prisma.playlistVideo.delete({
    where: {
      playlistId_videoId: {
        playlistId: id,
        videoId: videoId,
      }
    }
  });

  return {
    message:`Playlistdan video muvaffaqiyatli o'chirildi`
  };
}
}
