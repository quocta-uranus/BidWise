import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

export interface ProfileCompleteness {
  score: number;
  maxScore: number;
  percentage: number;
  breakdown: Record<string, { filled: boolean; weight: number }>;
}

@Injectable()
export class ProfileCompletenessService {
  calculate(input: {
    user: Pick<User, 'bio' | 'phone'>;
    hourlyRate: number;
    portfolioCount: number;
    hasCv: boolean;
    certificateCount: number;
    assessmentCompleted: boolean;
  }): ProfileCompleteness {
    const breakdown = {
      bio: { filled: !!input.user.bio?.trim(), weight: 15 },
      hourlyRate: { filled: input.hourlyRate > 0, weight: 10 },
      phone: { filled: !!input.user.phone?.trim(), weight: 15 },
      portfolio: { filled: input.portfolioCount > 0, weight: 20 },
      cv: { filled: input.hasCv, weight: 15 },
      certificates: { filled: input.certificateCount > 0, weight: 10 },
      assessment: { filled: input.assessmentCompleted, weight: 15 },
    };

    const score = Object.values(breakdown).reduce(
      (sum, item) => sum + (item.filled ? item.weight : 0),
      0,
    );

    return { score, maxScore: 100, percentage: score, breakdown };
  }
}
