import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';
import { CreateReportDto, OpenDisputeDto, SubmitEvidenceDto } from './dto/reports.dto';

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

  @Post('disputes')
  @HttpCode(HttpStatus.CREATED)
  openDispute(@CurrentUser() user: AccessTokenPayload, @Body() dto: OpenDisputeDto) {
    return this.reportsService.openDispute(user.sub, dto);
  }

  @Post('disputes/:disputeId/evidence')
  @HttpCode(HttpStatus.CREATED)
  submitEvidence(
    @CurrentUser() user: AccessTokenPayload,
    @Param('disputeId') disputeId: string,
    @Body() dto: SubmitEvidenceDto,
  ) {
    return this.reportsService.submitEvidence(user.sub, disputeId, dto);
  }

  @Get('disputes/:disputeId')
  getDispute(
    @CurrentUser() user: AccessTokenPayload,
    @Param('disputeId') disputeId: string,
  ) {
    return this.reportsService.getDispute(user.sub, disputeId);
  }
}
