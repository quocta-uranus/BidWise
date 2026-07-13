import { Injectable, BadRequestException } from '@nestjs/common';

export interface AhpPreset {
  id: string;
  name: string;
  description: string;
  weights: {
    priceWeight: number;
    skillWeight: number;
    experienceWeight: number;
    ratingWeight: number;
    speedWeight: number;
    deadlineWeight: number;
    portfolioWeight: number;
  };
  icon: string;
}

export const AHP_PRESETS: AhpPreset[] = [
  {
    id: 'BEST_VALUE',
    name: 'Best Value',
    description: 'Cân bằng giữa giá tốt và kỹ năng. Phù hợp với hầu hết các dự án.',
    icon: '⚖️',
    weights: {
      priceWeight: 40,
      skillWeight: 25,
      experienceWeight: 10,
      ratingWeight: 10,
      speedWeight: 5,
      deadlineWeight: 5,
      portfolioWeight: 5,
    },
  },
  {
    id: 'QUALITY_FIRST',
    name: 'Quality First',
    description: 'Ưu tiên kỹ năng, kinh nghiệm và portfolio. Phù hợp với dự án phức tạp, đòi hỏi chuyên môn cao.',
    icon: '🏆',
    weights: {
      priceWeight: 10,
      skillWeight: 35,
      experienceWeight: 15,
      ratingWeight: 20,
      speedWeight: 5,
      deadlineWeight: 5,
      portfolioWeight: 10,
    },
  },
  {
    id: 'FAST_DELIVERY',
    name: 'Fast Delivery',
    description: 'Ưu tiên tốc độ hoàn thành và đúng deadline. Phù hợp với dự án gấp, cần giao nhanh.',
    icon: '⚡',
    weights: {
      priceWeight: 15,
      skillWeight: 20,
      experienceWeight: 10,
      ratingWeight: 10,
      speedWeight: 15,
      deadlineWeight: 25,
      portfolioWeight: 5,
    },
  },
];

@Injectable()
export class AhpPresetsService {
  getAll(): AhpPreset[] {
    return AHP_PRESETS;
  }

  getById(id: string): AhpPreset {
    const preset = AHP_PRESETS.find((p) => p.id === id);
    if (!preset) throw new BadRequestException(`AHP_PRESET_NOT_FOUND: ${id}`);
    return preset;
  }

  resolveWeights(presetId: string) {
    return this.getById(presetId).weights;
  }
}
