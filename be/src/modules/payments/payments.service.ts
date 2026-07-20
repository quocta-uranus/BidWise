import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          escrow: 0,
          totalEarned: 0,
        },
      });
    }

    return wallet;
  }

  async deposit(userId: string, depositDto: DepositDto) {
    const wallet = await this.getOrCreateWallet(userId);

    const transaction = await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: depositDto.amount,
        description: `Nạp tiền vào ví qua ${depositDto.gateway}`,
        descKey: 'deposit',
        descParams: { gateway: depositDto.gateway },
        status: 'PENDING',
      },
    });

    // Simulate async payment webhook after 3 seconds
    setTimeout(async () => {
      try {
        await this.prisma.$transaction(async (tx) => {
          const pendingTransaction = await tx.transaction.findUnique({
            where: { id: transaction.id },
          });

          // A payment provider may retry the same webhook. Credit it only once.
          if (!pendingTransaction || pendingTransaction.status !== 'PENDING') return;

          const currentWallet = await tx.wallet.findUniqueOrThrow({
            where: { id: wallet.id },
          });
          const escrowDebt = Math.max(0, -currentWallet.escrow);
          const debtPayment = Math.min(depositDto.amount, escrowDebt);
          const availableCredit = depositDto.amount - debtPayment;

          await tx.transaction.update({
            where: { id: transaction.id },
            data: { status: 'SUCCESS' },
          });
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: { increment: availableCredit },
              escrow: { increment: debtPayment },
              totalEarned: { increment: depositDto.amount },
            },
          });
        });
        console.log(`[Mock Webhook] Deposit SUCCESS for transaction: ${transaction.id}`);
      } catch (err) {
        console.error(`[Mock Webhook] Deposit failed for transaction: ${transaction.id}`, err);
      }
    }, 3000);

    return { success: true, transactionId: transaction.id };
  }

  async withdraw(userId: string, withdrawDto: WithdrawDto) {
    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.balance < withdrawDto.amount) {
      throw new BadRequestException('Số dư khả dụng không đủ để rút.');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAW',
        amount: withdrawDto.amount,
        description: `Yêu cầu rút tiền về ${withdrawDto.method}`,
        descKey: 'withdraw',
        descParams: { method: withdrawDto.method, details: withdrawDto.details },
        status: 'PENDING',
      },
    });

    // Deduct immediately
    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: withdrawDto.amount },
      },
    });

    // Simulate success approval after 15 seconds
    setTimeout(async () => {
      try {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'SUCCESS' },
        });
        console.log(`[Mock Webhook] Withdrawal SUCCESS for transaction: ${transaction.id}`);
      } catch (err) {
        console.error(`[Mock Webhook] Withdrawal failed for transaction: ${transaction.id}`, err);
      }
    }, 15000);

    return { success: true };
  }

  async getTransactions(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    return this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { date: 'desc' },
    });
  }
}
