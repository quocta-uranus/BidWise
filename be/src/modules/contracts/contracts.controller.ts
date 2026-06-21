import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SubmitDeliverableDto } from './dto/submit-deliverable.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post('accept-bid')
  @Roles(RoleType.CLIENT)
  createContract(@CurrentUser() user: any, @Body() createDto: CreateContractDto) {
    return this.contractsService.createContract(user.sub, createDto.bidId);
  }

  @Post(':id/sign')
  @Roles(RoleType.FREELANCER)
  signContract(@CurrentUser() user: any, @Param('id') contractId: string) {
    return this.contractsService.signContract(user.sub, contractId);
  }

  @Patch(':cId/milestones/:mId/progress')
  @Roles(RoleType.FREELANCER)
  updateMilestoneProgress(
    @CurrentUser() user: any,
    @Param('cId') contractId: string,
    @Param('mId') milestoneId: string,
    @Body('progress') progress: number,
  ) {
    return this.contractsService.updateMilestoneProgress(user.sub, contractId, milestoneId, progress);
  }

  @Post(':cId/milestones/:mId/submit')
  @Roles(RoleType.FREELANCER)
  submitMilestone(
    @CurrentUser() user: any,
    @Param('cId') contractId: string,
    @Param('mId') milestoneId: string,
    @Body() submitDto: SubmitDeliverableDto,
  ) {
    return this.contractsService.submitMilestone(user.sub, contractId, milestoneId, submitDto);
  }

  @Post(':cId/milestones/:mId/approve')
  @Roles(RoleType.CLIENT)
  approveMilestone(
    @CurrentUser() user: any,
    @Param('cId') contractId: string,
    @Param('mId') milestoneId: string,
  ) {
    return this.contractsService.approveMilestone(user.sub, contractId, milestoneId);
  }

  @Post(':id/refund')
  @Roles(RoleType.CLIENT)
  requestRefund(@CurrentUser() user: any, @Param('id') contractId: string) {
    return this.contractsService.requestRefund(user.sub, contractId);
  }

  @Get()
  getContracts(@CurrentUser() user: any) {
    return this.contractsService.getContracts(user.sub);
  }

  @Post(':id/review-client')
  @Roles(RoleType.FREELANCER)
  reviewClient(
    @Param('id') contractId: string,
    @Body('clientReviewed') clientReviewed: boolean,
  ) {
    return this.contractsService.reviewClient(contractId, clientReviewed);
  }
}
