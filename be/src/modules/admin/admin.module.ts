import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TokenModule } from '../token/token.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TokenModule, EmailModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
