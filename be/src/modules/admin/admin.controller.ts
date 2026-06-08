import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsString } from 'class-validator';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';
import { RoleType } from '@prisma/client';

class AssignRoleDto {
  @IsEnum(RoleType)
  roleType: RoleType;
}

class SuspendDto {
  @IsString()
  reason: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Get('users/:userId')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  getUser(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Post('users/:userId/roles')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN)
  assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.assignRole(userId, dto.roleType, admin.sub);
  }

  @Delete('users/:userId/roles/:roleType')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN)
  revokeRole(
    @Param('userId') userId: string,
    @Param('roleType') roleType: RoleType,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.revokeRole(userId, roleType, admin.sub);
  }

  @Post('users/:userId/suspend')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  suspendUser(
    @Param('userId') userId: string,
    @Body() dto: SuspendDto,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.suspendUser(userId, dto.reason, admin.sub);
  }

  @Post('users/:userId/unsuspend')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  unsuspendUser(
    @Param('userId') userId: string,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.unsuspendUser(userId, admin.sub);
  }
}
