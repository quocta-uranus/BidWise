import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';
import { CreateReportDto } from '../admin/dto/admin.dto';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createReport(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(user.sub, dto);
  }
}
