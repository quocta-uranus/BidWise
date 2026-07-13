import { SkillGraphService } from './skill-graph.service';
import { RecommendationService } from './recommendation.service';

// ─── SkillGraphService — pure method tests ────────────────────────────────────

describe('SkillGraphService (pure methods)', () => {
  // null prisma is safe; no pure method touches this.prisma
  const sg = new SkillGraphService(null as any);

  // ─── tokenize ──────────────────────────────────────────────────────────────

  describe('tokenize()', () => {
    it('lowercases and splits on whitespace', () => {
      const tokens = sg.tokenize('React TypeScript NestJS');
      expect(tokens).toContain('react');
      expect(tokens).toContain('typescript');
      expect(tokens).toContain('nestjs');
    });

    it('removes English stopwords', () => {
      // 'am' is not in SkillGraphService's stopword list (checked against source)
      const tokens = sg.tokenize('I and you are a the developer awesome');
      expect(tokens).not.toContain('i');
      expect(tokens).not.toContain('and');
      expect(tokens).not.toContain('you');
      expect(tokens).not.toContain('are');
      expect(tokens).not.toContain('a');   // filtered by length ≤ 1
      expect(tokens).not.toContain('the');
      expect(tokens).toContain('developer');
      expect(tokens).toContain('awesome');
    });

    it('removes Vietnamese stopwords', () => {
      const tokens = sg.tokenize('tôi là một lập trình viên React');
      expect(tokens).not.toContain('tôi');
      expect(tokens).not.toContain('là');
      expect(tokens).not.toContain('một');
      expect(tokens).toContain('react');
    });

    it('filters single-character tokens', () => {
      const tokens = sg.tokenize('a b c react');
      expect(tokens).not.toContain('a');
      expect(tokens).not.toContain('b');
      expect(tokens).not.toContain('c');
    });

    it('strips special characters (keeps + # .)', () => {
      const tokens = sg.tokenize('C++ C# .NET react@3.0');
      expect(tokens).toContain('c++');
      expect(tokens).toContain('c#');
      expect(tokens).toContain('.net');
    });

    it('returns empty array for empty string', () => {
      expect(sg.tokenize('')).toEqual([]);
    });
  });

  // ─── buildFreelancerDocument ───────────────────────────────────────────────

  describe('buildFreelancerDocument()', () => {
    it('repeats skills 3× for weight boost', () => {
      const doc = sg.buildFreelancerDocument({
        skills: ['React', 'TypeScript'],
        bio: null,
        portfolioTitles: [],
        portfolioDescs: [],
      });
      const reactCount = (doc.match(/react/gi) ?? []).length;
      expect(reactCount).toBe(3);
    });

    it('includes bio text', () => {
      const doc = sg.buildFreelancerDocument({
        skills: [],
        bio: 'Passionate about building great products',
        portfolioTitles: [],
        portfolioDescs: [],
      });
      expect(doc).toContain('Passionate');
    });

    it('includes portfolio titles and descriptions', () => {
      const doc = sg.buildFreelancerDocument({
        skills: [],
        bio: null,
        portfolioTitles: ['Ecommerce Platform'],
        portfolioDescs: ['Built with Next.js and Stripe'],
      });
      expect(doc).toContain('Ecommerce Platform');
      expect(doc).toContain('Next.js');
    });

    it('handles null bio gracefully', () => {
      expect(() =>
        sg.buildFreelancerDocument({
          skills: ['React'],
          bio: null,
          portfolioTitles: [],
          portfolioDescs: [],
        }),
      ).not.toThrow();
    });
  });

  // ─── buildJobDocument ──────────────────────────────────────────────────────

  describe('buildJobDocument()', () => {
    it('repeats skills 3× for weight boost', () => {
      const doc = sg.buildJobDocument({
        title: 'Frontend Developer',
        description: 'Build a SPA',
        skills: ['react'],
      });
      const reactCount = (doc.match(/react/gi) ?? []).length;
      expect(reactCount).toBeGreaterThanOrEqual(3);
    });

    it('includes title and description', () => {
      const doc = sg.buildJobDocument({
        title: 'Senior Backend Engineer',
        description: 'Design REST APIs and microservices',
        skills: [],
      });
      expect(doc).toContain('Senior Backend Engineer');
      expect(doc).toContain('REST APIs');
    });
  });

  // ─── cosineSimilarity ─────────────────────────────────────────────────────

  describe('cosineSimilarity()', () => {
    it('returns 1 for identical non-zero vectors', () => {
      const v = [0.3, 0.5, 0.2];
      expect(sg.cosineSimilarity(v, v)).toBeCloseTo(1, 4);
    });

    it('returns 0 for zero vector', () => {
      expect(sg.cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    });

    it('returns 0 for orthogonal vectors', () => {
      expect(sg.cosineSimilarity([1, 0, 0], [0, 1, 0])).toBe(0);
    });

    it('returns value in [0, 1] for positive TF-IDF vectors', () => {
      const a = [0.1, 0.5, 0, 0.4, 0.2];
      const b = [0.0, 0.3, 0.6, 0.1, 0.0];
      const sim = sg.cosineSimilarity(a, b);
      expect(sim).toBeGreaterThanOrEqual(0);
      expect(sim).toBeLessThanOrEqual(1);
    });
  });

  // ─── buildTfIdfVectors ────────────────────────────────────────────────────

  describe('buildTfIdfVectors()', () => {
    it('returns same number of vectors as input docs', () => {
      const docs = ['react typescript', 'python django', 'flutter dart'];
      const { vectors } = sg.buildTfIdfVectors(docs);
      expect(vectors).toHaveLength(3);
    });

    it('all vectors have the same dimensionality (vocab size)', () => {
      const docs = ['react typescript', 'python django', 'flutter dart'];
      const { vocab, vectors } = sg.buildTfIdfVectors(docs);
      for (const v of vectors) {
        expect(v).toHaveLength(vocab.size);
      }
    });

    it('vocab covers all tokens from all documents', () => {
      const docs = ['react frontend', 'python backend'];
      const { vocab } = sg.buildTfIdfVectors(docs);
      expect(vocab.has('react')).toBe(true);
      expect(vocab.has('frontend')).toBe(true);
      expect(vocab.has('python')).toBe(true);
      expect(vocab.has('backend')).toBe(true);
    });

    it('term unique to a single doc has higher IDF weight than shared term', () => {
      // "react" appears in doc[0] only; "developer" appears in both
      const docs = ['react developer', 'vue developer'];
      const { vocab, vectors } = sg.buildTfIdfVectors(docs);

      const reactIdx = vocab.get('react')!;
      const developerIdx = vocab.get('developer')!;

      // For doc[0]: react (unique) should have higher TF-IDF than developer (shared)
      expect(vectors[0][reactIdx]).toBeGreaterThan(vectors[0][developerIdx]);
    });

    it('identical document vectors have cosine similarity = 1', () => {
      const docs = ['react typescript nestjs postgresql', 'react typescript nestjs postgresql'];
      const { vectors } = sg.buildTfIdfVectors(docs);
      expect(sg.cosineSimilarity(vectors[0], vectors[1])).toBeCloseTo(1, 4);
    });

    it('handles empty docs array', () => {
      const { vocab, vectors } = sg.buildTfIdfVectors([]);
      expect(vectors).toHaveLength(0);
      expect(vocab.size).toBe(0);
    });
  });
});

// ─── RecommendationService — ranking logic ────────────────────────────────────

describe('RecommendationService — getRecommendedFreelancers ranking', () => {
  const sg = new SkillGraphService(null as any);

  function buildMockPrisma(job: object, freelancers: object[]) {
    return {
      job: {
        findUnique: jest.fn().mockResolvedValue(job),
      },
      freelancerProfile: {
        findMany: jest.fn().mockResolvedValue(freelancers),
      },
    };
  }

  it('ranks React developer first for a React job', async () => {
    const job = {
      title: 'React Frontend Developer',
      description: 'Build a modern SPA dashboard with hooks and context API.',
      skills: ['react', 'typescript', 'css'],
    };

    const freelancers = [
      {
        userId: 'fl-python',
        skills: ['python', 'django', 'postgresql', 'celery'],
        hourlyRate: 40,
        assessmentLevel: null,
        assessmentScore: null,
        reputationTier: 'NEW',
        portfolioItems: [],
        user: { id: 'fl-python', fullName: 'Python Dev', avatarUrl: null, bio: 'Backend developer.' },
      },
      {
        userId: 'fl-react',
        skills: ['react', 'typescript', 'css', 'next.js', 'tailwindcss'],
        hourlyRate: 60,
        assessmentLevel: 'INTERMEDIATE',
        assessmentScore: 78,
        reputationTier: 'GOLD',
        portfolioItems: [
          { title: 'React Dashboard', desc: 'Built with hooks, context, typescript' },
        ],
        user: { id: 'fl-react', fullName: 'React Dev', avatarUrl: null, bio: 'Frontend specialist React TypeScript.' },
      },
      {
        userId: 'fl-mobile',
        skills: ['flutter', 'dart', 'ios', 'android'],
        hourlyRate: 55,
        assessmentLevel: null,
        assessmentScore: null,
        reputationTier: 'SILVER',
        portfolioItems: [],
        user: { id: 'fl-mobile', fullName: 'Mobile Dev', avatarUrl: null, bio: 'Flutter mobile developer.' },
      },
    ];

    const mockPrisma = buildMockPrisma(job, freelancers);
    const service = new RecommendationService(mockPrisma as any, sg);

    const results = await service.getRecommendedFreelancers('job-1', 5);

    expect(results).toHaveLength(3);
    expect(results[0].freelancerId).toBe('fl-react');
    expect(results[0].similarity).toBeGreaterThan(results[1].similarity);
  });

  it('returns matched skills subset of job skills', async () => {
    const job = {
      title: 'Backend Engineer',
      description: 'Build REST APIs with NestJS and PostgreSQL.',
      skills: ['nestjs', 'postgresql', 'typescript'],
    };

    const freelancers = [
      {
        userId: 'fl-nest',
        skills: ['nestjs', 'postgresql', 'typescript', 'redis'],
        hourlyRate: 70,
        assessmentLevel: 'SENIOR',
        assessmentScore: 90,
        reputationTier: 'VERIFIED',
        portfolioItems: [],
        user: { id: 'fl-nest', fullName: 'Nest Dev', avatarUrl: null, bio: 'NestJS expert.' },
      },
    ];

    const mockPrisma = buildMockPrisma(job, freelancers);
    const service = new RecommendationService(mockPrisma as any, sg);
    const results = await service.getRecommendedFreelancers('job-2', 5);

    expect(results[0].matchedSkills).toEqual(
      expect.arrayContaining(['nestjs', 'postgresql', 'typescript']),
    );
    expect(results[0].matchedSkills).not.toContain('redis');
  });

  it('returns empty array when job not found', async () => {
    const mockPrisma = buildMockPrisma(null, []);
    const service = new RecommendationService(mockPrisma as any, sg);
    const results = await service.getRecommendedFreelancers('nonexistent', 5);
    expect(results).toEqual([]);
  });

  it('returns empty array when no available freelancers', async () => {
    const job = { title: 'Job', description: 'Desc', skills: ['react'] };
    const mockPrisma = buildMockPrisma(job, []);
    const service = new RecommendationService(mockPrisma as any, sg);
    const results = await service.getRecommendedFreelancers('job-3', 5);
    expect(results).toEqual([]);
  });

  it('respects limit parameter', async () => {
    const job = { title: 'Fullstack Dev', description: 'SPA + API', skills: ['react', 'node.js'] };

    const freelancers = Array.from({ length: 10 }, (_, i) => ({
      userId: `fl-${i}`,
      skills: ['react', 'node.js', 'typescript'],
      hourlyRate: 50 + i * 5,
      assessmentLevel: null,
      assessmentScore: null,
      reputationTier: 'NEW',
      portfolioItems: [],
      user: { id: `fl-${i}`, fullName: `Dev ${i}`, avatarUrl: null, bio: '' },
    }));

    const mockPrisma = buildMockPrisma(job, freelancers);
    const service = new RecommendationService(mockPrisma as any, sg);
    const results = await service.getRecommendedFreelancers('job-4', 3);
    expect(results).toHaveLength(3);
  });
});
