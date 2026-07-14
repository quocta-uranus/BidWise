import { AhpTopsisService } from './ahp-topsis.service';
import type { BidCriteria, AhpWeights } from './ahp-topsis.service';

describe('AhpTopsisService', () => {
  let service: AhpTopsisService;

  beforeEach(() => {
    service = new AhpTopsisService();
  });

  // ─── AHP: computeAhpWeights ────────────────────────────────────────────────

  describe('computeAhpWeights()', () => {
    it('returns CR=0 for a perfectly consistent matrix', () => {
      // w = [0.5, 0.3, 0.2] → A[i][j] = w[i]/w[j]
      const w = [0.5, 0.3, 0.2];
      const matrix = w.map((wi) => w.map((wj) => wi / wj));
      const result = service.computeAhpWeights(matrix);

      expect(result.cr).toBeCloseTo(0, 2);
      expect(result.isConsistent).toBe(true);
      expect(result.lambdaMax).toBeCloseTo(3, 2);
      // Weights should be proportional to [0.5, 0.3, 0.2]
      expect(result.weights[0]).toBeCloseTo(0.5, 2);
      expect(result.weights[1]).toBeCloseTo(0.3, 2);
      expect(result.weights[2]).toBeCloseTo(0.2, 2);
    });

    it('returns CR ≤ 0.1 for Saaty standard 3×3 example', () => {
      // Saaty's example: compare 3 criteria with realistic judgments
      const matrix = [
        [1,    3,    5],
        [1/3,  1,    3],
        [1/5,  1/3,  1],
      ];
      const result = service.computeAhpWeights(matrix);

      expect(result.cr).toBeLessThanOrEqual(0.1);
      expect(result.isConsistent).toBe(true);
      // Weights should sum to 1
      const sum = result.weights.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 4);
      // First criterion should be most important
      expect(result.weights[0]).toBeGreaterThan(result.weights[1]);
      expect(result.weights[1]).toBeGreaterThan(result.weights[2]);
    });

    it('detects inconsistency when CR > 0.1', () => {
      // Severely inconsistent: 1>3>7>1 circular
      const matrix = [
        [1,   9,   1/9],
        [1/9, 1,   9  ],
        [9,   1/9, 1  ],
      ];
      const result = service.computeAhpWeights(matrix);

      expect(result.cr).toBeGreaterThan(0.1);
      expect(result.isConsistent).toBe(false);
    });

    it('returns CR=0 for 2×2 matrix (no inconsistency possible)', () => {
      const matrix = [[1, 4], [1/4, 1]];
      const result = service.computeAhpWeights(matrix);

      expect(result.cr).toBeCloseTo(0, 4);
      expect(result.isConsistent).toBe(true);
    });

    it('computes weights that sum to 1.0', () => {
      const matrix = [
        [1, 2, 4, 3, 5, 6, 7],
        [1/2, 1, 2, 1, 3, 4, 5],
        [1/4, 1/2, 1, 1/2, 2, 3, 4],
        [1/3, 1, 2, 1, 3, 4, 5],
        [1/5, 1/3, 1/2, 1/3, 1, 2, 3],
        [1/6, 1/4, 1/3, 1/4, 1/2, 1, 2],
        [1/7, 1/5, 1/4, 1/5, 1/3, 1/2, 1],
      ];
      const result = service.computeAhpWeights(matrix);

      const sum = result.weights.reduce((a, b) => a + b, 0);
      // rounding each weight to 4 d.p. × 7 weights can accumulate ~7e-4 error
      expect(sum).toBeCloseTo(1, 3);
    });

    it('throws on negative or zero values', () => {
      const matrix = [[1, -2], [-0.5, 1]];
      expect(() => service.computeAhpWeights(matrix)).toThrow();
    });

    it('throws on non-square matrix', () => {
      const matrix = [[1, 2, 3], [1/2, 1]];
      expect(() => service.computeAhpWeights(matrix as any)).toThrow();
    });
  });

  // ─── TOPSIS: rank() ────────────────────────────────────────────────────────

  describe('rank()', () => {
    const BEST_VALUE_WEIGHTS: AhpWeights = {
      priceWeight: 40, skillWeight: 25, experienceWeight: 10,
      ratingWeight: 10, speedWeight: 5, deadlineWeight: 5, portfolioWeight: 5,
    };

    const makeBid = (id: string, price: number, skill: number, exp: number): BidCriteria => ({
      bidId: id,
      freelancerId: `fl-${id}`,
      price,
      skillMatch: skill,
      experience: exp,
      rating: 4.5,
      speed: 7,
      deadlineFit: 0.8,
      portfolioScore: 3,
    });

    it('ranks lower price + higher skill higher with Best Value preset', () => {
      const bids: BidCriteria[] = [
        makeBid('A', 100, 0.9, 5),   // cheap + skilled → rank #1
        makeBid('B', 250, 0.6, 3),   // mid → rank #2
        makeBid('C', 450, 0.3, 1),   // expensive + weak → rank #3
      ];

      const results = service.rank(bids, BEST_VALUE_WEIGHTS);
      expect(results[0].bidId).toBe('A');
      expect(results[1].bidId).toBe('B');
      expect(results[2].bidId).toBe('C');
      expect(results[0].topsisScore).toBeGreaterThan(results[1].topsisScore);
    });

    it('assigns contiguous integer ranks starting from 1', () => {
      const bids: BidCriteria[] = [
        makeBid('X', 200, 0.7, 3),
        makeBid('Y', 300, 0.5, 2),
        makeBid('Z', 150, 0.8, 4),
      ];
      const results = service.rank(bids, BEST_VALUE_WEIGHTS);
      const ranks = results.map((r) => r.rank).sort((a, b) => a - b);
      expect(ranks).toEqual([1, 2, 3]);
    });

    it('returns empty array for empty input', () => {
      expect(service.rank([], BEST_VALUE_WEIGHTS)).toEqual([]);
    });

    it('handles single bid gracefully (score=0 when A+ = A-)', () => {
      const bids = [makeBid('solo', 100, 0.9, 5)];
      const results = service.rank(bids, BEST_VALUE_WEIGHTS);
      expect(results).toHaveLength(1);
      expect(results[0].rank).toBe(1);
    });

    it('TOPSIS scores are in [0, 1]', () => {
      const bids: BidCriteria[] = [
        makeBid('a', 50, 1.0, 10),
        makeBid('b', 500, 0.0, 0),
        makeBid('c', 200, 0.5, 5),
      ];
      const results = service.rank(bids, BEST_VALUE_WEIGHTS);
      for (const r of results) {
        expect(r.topsisScore).toBeGreaterThanOrEqual(0);
        expect(r.topsisScore).toBeLessThanOrEqual(1);
      }
    });

    it('Quality First preset ranks high-skill bid above low-price bid', () => {
      const qualityFirstWeights: AhpWeights = {
        priceWeight: 10, skillWeight: 35, experienceWeight: 15,
        ratingWeight: 20, speedWeight: 5, deadlineWeight: 5, portfolioWeight: 10,
      };

      const cheapButWeak = makeBid('cheap', 50, 0.2, 1);
      const expensiveButSkilled = makeBid('skilled', 400, 0.95, 8);
      cheapButWeak.rating = 2.5;
      expensiveButSkilled.rating = 4.9;

      const results = service.rank([cheapButWeak, expensiveButSkilled], qualityFirstWeights);
      expect(results[0].bidId).toBe('skilled');
    });
  });
});
