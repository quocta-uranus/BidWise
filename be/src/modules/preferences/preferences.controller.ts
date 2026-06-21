import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { RoleType } from '@prisma/client';

@Controller('freelancer/preferences')
@UseGuards(RolesGuard)
@Roles(RoleType.FREELANCER)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  get(@CurrentUser() user: any) {
    return this.preferencesService.getOrCreate(user.sub);
  }

  @Put()
  update(@CurrentUser() user: any, @Body() dto: UpdatePreferenceDto) {
    return this.preferencesService.update(user.sub, dto);
  }
}
