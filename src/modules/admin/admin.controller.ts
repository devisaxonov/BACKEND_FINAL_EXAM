import { Controller, Get, Query, Patch, Param, UseGuards, SetMetadata, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import AuthGuard from 'src/common/guards/auth.guard';
import RoleGuard from 'src/common/guards/role.guard';
import { CreateAdminDto } from './dto/create-admin.dto';

@UseGuards(AuthGuard, RoleGuard)
@SetMetadata('roles',["SUPERADMIN","ADMIN"])
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}


  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('videos/pending')
  getPendingVideos(@Query('limit') limit = '20', @Query('page') page = '1') {
    return this.adminService.getPendingVideos(+limit, +page);
  }

  @Patch('videos/:id/approve')
  approveVideo(@Param('id') id: string) {
    return this.adminService.approveVideo(id);
  }

  @Patch('videos/:id/reject')
  rejectVideo(@Param('id') id: string) {
    return this.adminService.rejectVideo(id);
  }

  @Get('users')
  getUsers(
    @Query('limit') limit = '50',
    @Query('page') page = '1',
    @Query('search') search = '',
    @Query('status') status = ''
  ) {
    return this.adminService.getUsers(+limit, +page, search, status);
  }

  @Patch('users/:id/block')
  blockUser(@Param('id') id: string) {
    return this.adminService.blockUser(id);
  }

  @Patch('users/:id/verify')
  verifyUser(@Param('id') id: string) {
    return this.adminService.verifyUser(id);
  }
  
  @Post('create')
  @SetMetadata('roles', ["SUPERADMIN"])
  async createAdmin(@Body() data:CreateAdminDto) {
    return await this.adminService.createAdmin(data);
  }
}
