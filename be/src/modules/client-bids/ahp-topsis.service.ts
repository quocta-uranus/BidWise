import { Injectable } from '@nestjs/common';

export interface BidCriteria {
  bidId: string;
  freelancerId: string;
  price: number;
  skillMatch: number;
  experience: number;
  rating: number;
  speed: number;
  deadlineFit: number;
  portfolioScore: number;
}

export interface AhpWeights {
  priceWeight: number;
  skillWeight: number;
  experienceWeight: number;
  ratingWeight: number;
  speedWeight: number;
  deadlineWeight: number;
  portfolioWeight: number;
}

export interface TopsisResult {
  bidId: string;
  freelancerId: string;
  topsisScore: number;
  rank: number;
  normalizedCriteria: Record<string, number>;
  weightedCriteria: Record<string, number>;
  distanceToIdeal: number;
  distanceToNegIdeal: number;
}

@Injectable()
export class AhpTopsisService {
  rank(bids: BidCriteria[], weights: AhpWeights): TopsisResult[] {
    if (bids.length === 0) return [];

    const w = this.normalizeWeights(weights);

    // Build matrix: rows = bids, cols = criteria
    // Price is cost criterion (lower is better) — invert for TOPSIS (use 1/price or normalize inversely)
    const matrix = bids.map((b) => [
      b.price,        // cost → lower is better
      b.skillMatch,   // benefit
      b.experience,   // benefit
      b.rating,       // benefit
      b.speed,        // cost → lower delivery days is better
      b.deadlineFit,  // benefit
      b.portfolioScore, // benefit
    ]);

    const isCost = [true, false, false, false, true, false, false];
    const weightArr = [w.price, w.skill, w.experience, w.rating, w.speed, w.deadline, w.portfolio];
    const criteriaKeys = ['price', 'skillMatch', 'experience', 'rating', 'speed', 'deadlineFit', 'portfolioScore'];

    // Step 1: Normalize decision matrix (vector normalization)
    const colSums = weightArr.map((_, ci) => {
      const sum = matrix.reduce((s, row) => s + row[ci] * row[ci], 0);
      return Math.sqrt(sum) || 1;
    });

    const normalized = matrix.map((row) => row.map((val, ci) => val / colSums[ci]));

    // Step 2: Weighted normalized matrix
    const weighted = normalized.map((row) => row.map((val, ci) => val * weightArr[ci]));

    // Step 3: Ideal positive (A+) and negative (A-)
    const aPlus = weightArr.map((_, ci) => {
      const col = weighted.map((r) => r[ci]);
      return isCost[ci] ? Math.min(...col) : Math.max(...col);
    });
    const aMinus = weightArr.map((_, ci) => {
      const col = weighted.map((r) => r[ci]);
      return isCost[ci] ? Math.max(...col) : Math.min(...col);
    });

    // Step 4: Distance to A+ and A-
    const results: TopsisResult[] = bids.map((bid, i) => {
      const dPlus = Math.sqrt(
        weighted[i].reduce((s, v, ci) => s + Math.pow(v - aPlus[ci], 2), 0),
      );
      const dMinus = Math.sqrt(
        weighted[i].reduce((s, v, ci) => s + Math.pow(v - aMinus[ci], 2), 0),
      );
      const score = dPlus + dMinus === 0 ? 0 : dMinus / (dPlus + dMinus);

      const normalizedCriteria: Record<string, number> = {};
      const weightedCriteria: Record<string, number> = {};
      criteriaKeys.forEach((k, ci) => {
        normalizedCriteria[k] = Math.round(normalized[i][ci] * 10000) / 10000;
        weightedCriteria[k] = Math.round(weighted[i][ci] * 10000) / 10000;
      });

      return {
        bidId: bid.bidId,
        freelancerId: bid.freelancerId,
        topsisScore: Math.round(score * 10000) / 10000,
        rank: 0,
        normalizedCriteria,
        weightedCriteria,
        distanceToIdeal: Math.round(dPlus * 10000) / 10000,
        distanceToNegIdeal: Math.round(dMinus * 10000) / 10000,
      };
    });

    // Step 5: Rank descending by TOPSIS score
    results.sort((a, b) => b.topsisScore - a.topsisScore);
    results.forEach((r, i) => (r.rank = i + 1));

    return results;
  }

  private normalizeWeights(w: AhpWeights) {
    const total =
      w.priceWeight + w.skillWeight + w.experienceWeight +
      w.ratingWeight + w.speedWeight + w.deadlineWeight + w.portfolioWeight || 100;
    return {
      price: w.priceWeight / total,
      skill: w.skillWeight / total,
      experience: w.experienceWeight / total,
      rating: w.ratingWeight / total,
      speed: w.speedWeight / total,
      deadline: w.deadlineWeight / total,
      portfolio: w.portfolioWeight / total,
    };
  }
}
