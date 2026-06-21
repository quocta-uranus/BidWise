import { Injectable } from '@nestjs/common';

export interface MatchBreakdownItem {
  criterion: string;
  weight: number;
  score: number;
  weightedScore: number;
  reason: string;
}

export interface MatchResult {
  score: number; // 0..1
  breakdown: MatchBreakdownItem[];
}

@Injectable()
export class BidMatchingService {
  async computeMatch(userId: string, job: any, profile: any, bidAmount?: number): Promise<MatchResult> {
    const items: MatchBreakdownItem[] = [];

    // 1) Price: how competitive the bid is vs budget
    const budget = job.budget ?? 0;
    const bidPrice = bidAmount ?? 0;
    const priceScore = this.scorePrice(budget, bidPrice);
    items.push({
      criterion: 'price',
      weight: 0.25,
      score: priceScore,
      weightedScore: 0.25 * priceScore,
      reason: this.priceReason(budget, bidPrice),
    });

    // 2) Skill match - job.skills is String[]
    const jobSkills = (job.skills ?? []).map((s: string) => s.toLowerCase());
    const profileSkills = (profile.skills ?? []).map((s: string) => s.toLowerCase());
    const matched = jobSkills.filter((s: string) => profileSkills.includes(s));
    const skillScore = jobSkills.length ? matched.length / jobSkills.length : 0.5;
    items.push({
      criterion: 'skill',
      weight: 0.30,
      score: skillScore,
      weightedScore: 0.30 * skillScore,
      reason:
        matched.length > 0
          ? `Khớp ${matched.length}/${jobSkills.length} kỹ năng: ${matched.slice(0, 3).join(', ')}`
          : 'Chưa có kỹ năng khớp — bổ sung vào profile sẽ cải thiện điểm',
    });

    // 3) Experience: profile.experience string + portfolio count
    const expScore = this.scoreExperience(profile);
    items.push({
      criterion: 'experience',
      weight: 0.20,
      score: expScore,
      weightedScore: 0.20 * expScore,
      reason: expScore > 0.6 ? 'Profile dày dặn kinh nghiệm' : 'Cần bổ sung kinh nghiệm/portfolio',
    });

    // 4) Assessment: completed assessment boosts score
    const assessmentScore = (profile.assessmentCompleted ? 0.5 : 0) + (profile.assessmentScore ? profile.assessmentScore / 100 : 0);
    items.push({
      criterion: 'assessment',
      weight: 0.15,
      score: Math.min(1, assessmentScore),
      weightedScore: 0.15 * Math.min(1, assessmentScore),
      reason: profile.assessmentCompleted ? 'Đã hoàn thành đánh giá năng lực' : 'Chưa hoàn thành đánh giá',
    });

    // 5) Availability
    const availScore = profile.available ? 1 : 0.5;
    items.push({
      criterion: 'availability',
      weight: 0.10,
      score: availScore,
      weightedScore: 0.10 * availScore,
      reason: profile.available ? 'Sẵn sàng nhận việc' : 'Hiện không khả dụng',
    });

    const total = items.reduce((sum, it) => sum + it.weightedScore, 0);
    return {
      score: Math.max(0, Math.min(1, Number(total.toFixed(4)))),
      breakdown: items,
    };
  }

  private scorePrice(budget: number, bidPrice: number): number {
    if (!bidPrice || !budget) return 0.5;
    const ratio = bidPrice / budget;
    if (ratio <= 1 && ratio >= 0.7) return 1; // competitive
    if (ratio < 0.7) return 0.8; // very low, may signal low quality
    if (ratio <= 1.2) return 0.7;
    if (ratio <= 1.5) return 0.4;
    return 0.2;
  }

  private priceReason(budget: number, bidPrice: number): string {
    if (!budget) return 'Job chưa có ngân sách rõ — tập trung vào giá trị đề xuất';
    if (!bidPrice) return 'Chưa có giá bid — hãy nhập giá để tính điểm';
    const ratio = bidPrice / budget;
    if (ratio <= 1) return 'Giá bid cạnh tranh so với ngân sách';
    return `Giá bid cao hơn ${Math.round((ratio - 1) * 100)}% ngân sách — cân nhắc điều chỉnh`;
  }

  private scoreExperience(profile: any): number {
    const exp = (profile.experience ?? '').toString();
    let s = 0.3; // baseline
    if (exp.length > 50) s += 0.2;
    if (exp.length > 200) s += 0.2;
    if (profile.assessmentCompleted) s += 0.3;
    return Math.min(1, s);
  }
}
