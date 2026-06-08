import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AccessTokenPayload) {
    return this.usersService.getMe(user.sub);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get('me/sessions')
  getSessions(@CurrentUser() user: AccessTokenPayload) {
    return this.usersService.getSessions(user.sub, user.sessionId);
  }

  @Delete('me/sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  revokeSession(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.usersService.revokeSession(user.sub, sessionId);
  }
}
