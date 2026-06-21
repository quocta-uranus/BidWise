import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoleType } from '@prisma/client';
import type { Response } from 'express';
import { FreelancerService } from './freelancer.service';
import {
  CreateCertificateDto,
  CreatePortfolioDto,
  SubmitAssessmentDto,
  ToggleAvailableDto,
  UpdateFreelancerProfileDto,
} from './dto/freelancer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';
import type { UploadedFilePayload } from './types/upload.types';
import { MAX_UPLOAD_BYTES } from './constants/upload.constants';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { memoryStorage } = require('multer');

const uploadInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.FREELANCER)
@Controller('freelancer')
export class FreelancerController {
  constructor(private freelancerService: FreelancerService) {}

  /** FL-01: Get freelancer profile + completeness score */
  @Get('profile')
  getProfile(@CurrentUser() user: AccessTokenPayload) {
    return this.freelancerService.getProfile(user.sub);
  }

  /** FL-01: Update profile fields */
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdateFreelancerProfileDto,
  ) {
    return this.freelancerService.updateProfile(user.sub, dto);
  }

  /** FL-06: Toggle available for work */
  @Patch('profile/available')
  setAvailable(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: ToggleAvailableDto,
  ) {
    return this.freelancerService.setAvailable(user.sub, dto.available);
  }

  /** FL-02: Add portfolio item (link and/or file) */
  @Post('portfolio')
  @UseInterceptors(uploadInterceptor)
  addPortfolio(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreatePortfolioDto,
    @UploadedFile() file?: UploadedFilePayload,
  ) {
    return this.freelancerService.addPortfolio(user.sub, dto, file);
  }

  @Delete('portfolio/:id')
  deletePortfolio(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    return this.freelancerService.deletePortfolio(user.sub, id);
  }

  /** FL-03: Upload CV (PDF) */
  @Post('cv')
  @UseInterceptors(uploadInterceptor)
  uploadCv(
    @CurrentUser() user: AccessTokenPayload,
    @UploadedFile() file: UploadedFilePayload,
  ) {
    return this.freelancerService.uploadCv(user.sub, file);
  }

  @Delete('cv')
  deleteCv(@CurrentUser() user: AccessTokenPayload) {
    return this.freelancerService.deleteCv(user.sub);
  }

  /** FL-04: Add certificate */
  @Post('certificates')
  @UseInterceptors(uploadInterceptor)
  addCertificate(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateCertificateDto,
    @UploadedFile() file?: UploadedFilePayload,
  ) {
    return this.freelancerService.addCertificate(user.sub, dto, file);
  }

  @Delete('certificates/:id')
  deleteCertificate(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    return this.freelancerService.deleteCertificate(user.sub, id);
  }

  /** FL-05: Get assessment questions (without correct answers) */
  @Get('assessment/questions')
  getAssessmentQuestions() {
    return this.freelancerService.getAssessmentQuestions();
  }

  /** FL-05: Submit assessment answers */
  @Post('assessment/submit')
  submitAssessment(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: SubmitAssessmentDto,
  ) {
    return this.freelancerService.submitAssessment(user.sub, dto);
  }

  @Get('assessment/result')
  getAssessmentResult(@CurrentUser() user: AccessTokenPayload) {
    return this.freelancerService.getAssessmentResult(user.sub);
  }

  /** Serve uploaded files (portfolio / cv / certificates) */
  @Get('files/:category/:filename')
  serveFile(
    @CurrentUser() user: AccessTokenPayload,
    @Param('category') category: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.freelancerService.serveFile(user.sub, category, filename, res);
  }
}
