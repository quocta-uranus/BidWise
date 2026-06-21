import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FreelancerProfileService } from './freelancer-profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { UploadCvDto } from './dto/upload-cv.dto';
import { AddCertificateDto } from './dto/add-certificate.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AddSkillDto, SubmitAssessmentDto } from './dto/update-profile.dto';

@Controller('freelancer-profile')
@UseGuards(JwtAuthGuard)
export class FreelancerProfileController {
  constructor(private readonly service: FreelancerProfileService) {}

  @Post()
  createProfile(@CurrentUser() user: any, @Body() dto: CreateProfileDto) {
    return this.service.createProfile(user.sub, dto);
  }

  @Get('me')
  getMyProfile(@CurrentUser() user: any) {
    return this.service.getMyProfile(user.sub);
  }

  @Put('me')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(user.sub, dto);
  }

  @Post('portfolio')
  createPortfolio(@CurrentUser() user: any, @Body() dto: CreatePortfolioDto) {
    return this.service.createPortfolio(user.sub, dto);
  }

  @Get('portfolio')
  getPortfolios(@CurrentUser() user: any) {
    return this.service.getPortfolios(user.sub);
  }

  @Put('portfolio/:portfolioId')
  updatePortfolio(
    @CurrentUser() user: any,
    @Param('portfolioId') portfolioId: string,
    @Body() dto: UpdatePortfolioDto,
  ) {
    return this.service.updatePortfolio(user.sub, portfolioId, dto);
  }

  @Delete('portfolio/:portfolioId')
  @HttpCode(HttpStatus.OK)
  deletePortfolio(@CurrentUser() user: any, @Param('portfolioId') portfolioId: string) {
    return this.service.deletePortfolio(user.sub, portfolioId);
  }

  @Post('cv')
  uploadCv(@CurrentUser() user: any, @Body() dto: UploadCvDto) {
    return this.service.uploadCv(user.sub, dto);
  }

  @Get('cv')
  getCv(@CurrentUser() user: any) {
    return this.service.getCv(user.sub);
  }

  @Delete('cv')
  deleteCv(@CurrentUser() user: any) {
    return this.service.deleteCv(user.sub);
  }

  @Post('certifications')
  addCertification(@CurrentUser() user: any, @Body() dto: AddCertificateDto) {
    return this.service.addCertification(user.sub, dto);
  }

  @Get('certifications')
  getCertifications(@CurrentUser() user: any) {
    return this.service.getCertifications(user.sub);
  }

  @Delete('certifications/:certificationId')
  @HttpCode(HttpStatus.OK)
  deleteCertification(
    @CurrentUser() user: any,
    @Param('certificationId') certificationId: string,
  ) {
    return this.service.deleteCertification(user.sub, certificationId);
  }

  @Put('availability')
  updateAvailability(
    @CurrentUser() user: any,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.service.updateAvailability(user.sub, dto);
  }

  // FL-05: Skill management
  @Post('skills')
  addSkill(@CurrentUser() user: any, @Body() dto: AddSkillDto) {
    return this.service.addSkill(user.sub, dto.skill);
  }

  @Delete('skills/:skill')
  removeSkill(@CurrentUser() user: any, @Param('skill') skill: string) {
    return this.service.removeSkill(user.sub, decodeURIComponent(skill));
  }

  // FL-05: Assessment
  @Post('assessment')
  submitAssessment(@CurrentUser() user: any, @Body() dto: SubmitAssessmentDto) {
    return this.service.submitAssessment(user.sub, dto.answers ?? []);
  }
}
