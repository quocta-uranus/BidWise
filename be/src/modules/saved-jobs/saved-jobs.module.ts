import { Module } from '@nestjs/common';
import { SavedJobsService } from './saved-jobs.service';
import { SavedJobsController } from './saved-jobs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SavedJobsService],
  controllers: [SavedJobsController],
  exports: [SavedJobsService],
})
export class SavedJobsModule {}
