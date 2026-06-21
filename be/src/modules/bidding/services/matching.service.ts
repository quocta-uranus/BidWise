import { Injectable } from '@nestjs/common';

export interface MatchBreakdown {
  skills: { score: number; max: number; matched: string[]; missing: string[]; explanation: string };
  budget: { score: number; max: number; withinBudget: boolean; explanation: string };
  assessment: { score: number; max: number; completed: boolean; explanation: string };
  profile: { score: number; max: number; explanation: string };
  total: number;
}

interface JobForMatching {
  skills: string[];
  budget: number | null;
  minBudget: number | null;
  maxBudget: number | null;
  fixedBudget: number | null;
}

@Injectable()
export class MatchingService {
  calculate(
    job: JobForMatching,
    profile: { skills?: string[]; hourlyRate?: number | null; assessmentCompleted?: boolean | null } | null,
    user: { bio: string | null; phone: string | null } | null,
    bidAmount: number,
  ): { score: number; breakdown: MatchBreakdown } {
    const jobSkills = (job.skills ?? []).map((s: string) => s.toLowerCase());
    const freelancerSkills = (profile?.skills ?? []).map((s: string) => s.toLowerCase());
    const matched = jobSkills.filter((s: string) => freelancerSkills.includes(s));
    const missing = jobSkills.filter((s: string) => !freelancerSkills.includes(s));
    const skillRatio = jobSkills.length > 0 ? matched.length / jobSkills.length : 0;
    const skillsScore = Math.round(skillRatio * 50);

    const budgetNum =
      Number(job.budget ?? job.minBudget ?? job.maxBudget ?? job.fixedBudget ?? 0);
    let budgetScore = 0;
    let withinBudget = false;
    if (bidAmount > 0 && budgetNum > 0) {
      withinBudget = bidAmount <= budgetNum;
      if (withinBudget) {
        const ratio = bidAmount / budgetNum;
        budgetScore = ratio <= 0.85 ? 30 : Math.round(30 * (1 - (ratio - 0.85) / 0.15));
        budgetScore = Math.max(10, Math.min(30, budgetScore));
      } else {
        budgetScore = Math.max(0, Math.round(15 * (budgetNum / bidAmount)));
      }
    }

    const assessmentCompleted = profile?.assessmentCompleted ?? false;
    const assessmentScore = assessmentCompleted ? 15 : 0;

    let profileScore = 0;
    if (user?.bio) profileScore += 2;
    if (user?.phone) profileScore += 1;
    if (profile && Number(profile.hourlyRate ?? 0) > 0) profileScore += 1;
    if (freelancerSkills.length >= 3) profileScore += 1;
    profileScore = Math.min(5, profileScore);

    const total = Math.min(100, skillsScore + budgetScore + assessmentScore + profileScore);

    return {
      score: total,
      breakdown: {
        skills: {
          score: skillsScore,
          max: 50,
          matched,
          missing,
          explanation:
            matched.length > 0
              ? `${matched.length}/${jobSkills.length} required skills matched`
              : 'No required skills matched',
        },
        budget: {
          score: budgetScore,
          max: 30,
          withinBudget,
          explanation: withinBudget
            ? `Bid $${bidAmount} is within job budget $${budgetNum}`
            : `Bid $${bidAmount} exceeds job budget $${budgetNum}`,
        },
        assessment: {
          score: assessmentScore,
          max: 15,
          completed: assessmentCompleted,
          explanation: assessmentCompleted
            ? 'Skills assessment completed (+15%)'
            : 'Complete assessment to gain up to 15% match score',
        },
        profile: { score: profileScore, max: 5, explanation: 'Profile completeness bonus' },
        total,
      },
    };
  }
}
