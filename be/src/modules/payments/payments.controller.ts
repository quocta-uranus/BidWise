import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('wallet')
  getWallet(@CurrentUser() user: any) {
    return this.paymentsService.getOrCreateWallet(user.sub);
  }

  @Post('deposit')
  deposit(@CurrentUser() user: any, @Body() depositDto: DepositDto) {
    return this.paymentsService.deposit(user.sub, depositDto);
  }

  @Post('withdraw')
  withdraw(@CurrentUser() user: any, @Body() withdrawDto: WithdrawDto) {
    return this.paymentsService.withdraw(user.sub, withdrawDto);
  }

  @Get('transactions')
  getTransactions(@CurrentUser() user: any) {
    return this.paymentsService.getTransactions(user.sub);
  }
}
