import { NlpSpamService } from './nlp-spam.service';

describe('NlpSpamService', () => {
  let service: NlpSpamService;

  beforeEach(() => {
    service = new NlpSpamService();
  });

  // ─── Edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns safe result when no existing letters', () => {
      const result = service.checkSpam('Great cover letter text here.', []);
      expect(result).toEqual({ spamScore: 0, isTemplateBid: false, mostSimilarIndex: -1 });
    });

    it('returns safe result for empty new cover letter', () => {
      const result = service.checkSpam('', ['Some existing cover letter.']);
      expect(result).toEqual({ spamScore: 0, isTemplateBid: false, mostSimilarIndex: -1 });
    });

    it('returns safe result when cover letter is only stopwords', () => {
      const result = service.checkSpam('I am a the and or', ['Another one for the job.']);
      expect(result.spamScore).toBe(0);
      expect(result.isTemplateBid).toBe(false);
    });
  });

  // ─── Identical text → flagged as spam ───────────────────────────────────────

  describe('identical cover letters', () => {
    it('scores 1.0 when cover letter is identical to existing', () => {
      const coverLetter =
        'Experienced React developer with strong TypeScript skills. ' +
        'Built enterprise applications with NestJS and PostgreSQL. ' +
        'Available immediately and committed to quality delivery.';

      const result = service.checkSpam(coverLetter, [coverLetter]);
      expect(result.spamScore).toBeCloseTo(1, 2);
      expect(result.isTemplateBid).toBe(true);
      expect(result.mostSimilarIndex).toBe(0);
    });

    it('picks the most-similar letter among multiple existing', () => {
      const newLetter =
        'Full-stack developer experienced with React, NestJS, PostgreSQL.';
      const existing = [
        'Data scientist working with Python machine learning pandas tensorflow.',
        'Full-stack developer experienced with React, NestJS, PostgreSQL.',  // identical — idx 1
        'UI/UX designer specializing in Figma and Adobe creative tools.',
      ];

      const result = service.checkSpam(newLetter, existing);
      expect(result.mostSimilarIndex).toBe(1);
      expect(result.spamScore).toBeCloseTo(1, 2);
    });
  });

  // ─── Completely different text → not spam ───────────────────────────────────

  describe('completely different cover letters', () => {
    it('scores near 0 for unrelated domains', () => {
      const newLetter =
        'Backend Node.js engineer building microservices and REST APIs ' +
        'with Docker, Kubernetes and CI/CD pipelines.';
      const existing = [
        'Graphic designer creating logos brand identity print materials packaging.',
        'Mobile iOS developer building Swift applications App Store deployment.',
      ];

      const result = service.checkSpam(newLetter, existing);
      expect(result.spamScore).toBeLessThan(0.5);
      expect(result.isTemplateBid).toBe(false);
    });

    it('returns false when only one shared rare term', () => {
      const newLetter =
        'Machine learning engineer specializing tensorflow deep neural networks ' +
        'computer vision object detection classification algorithms.';
      const existing = [
        'Frontend developer building beautiful responsive websites with React Vue Angular.',
      ];

      const result = service.checkSpam(newLetter, existing);
      expect(result.isTemplateBid).toBe(false);
    });
  });

  // ─── Template variants → spam flagged ──────────────────────────────────────

  describe('template variants (minor substitutions)', () => {
    it('flags template when only numbers differ', () => {
      const template =
        'Professional React developer years experience building modern web applications. ' +
        'Completed projects startups enterprise clients. Deliver quality code on time. ' +
        'Expert TypeScript NestJS PostgreSQL Docker deployed production.';

      const variant =
        'Professional React developer years experience building modern web applications. ' +
        'Completed projects startups enterprise clients. Deliver quality code deadline. ' +
        'Expert TypeScript NestJS PostgreSQL Docker deployed production.';

      const result = service.checkSpam(variant, [template]);
      expect(result.isTemplateBid).toBe(true);
      expect(result.spamScore).toBeGreaterThan(0.85);
    });

    it('flags template when client name is substituted', () => {
      const template =
        'Dear client greeting. Experienced backend developer NodeJS Express MongoDB ' +
        'building scalable REST APIs microservices architecture clean code practices. ' +
        'Previous similar project completed successfully delivered ahead schedule.';

      const variant =
        'Dear hiring manager greeting. Experienced backend developer NodeJS Express MongoDB ' +
        'building scalable REST APIs microservices architecture clean code practices. ' +
        'Previous similar project completed successfully delivered ahead schedule.';

      const result = service.checkSpam(variant, [template]);
      expect(result.isTemplateBid).toBe(true);
    });

    it('does NOT flag genuinely personalized letter with shared skills', () => {
      const existing =
        'Experienced React developer portfolio includes ecommerce dashboard admin panel. ' +
        'Familiar Redux Zustand state management REST GraphQL integration.';

      const genuine =
        'Reviewed carefully project requirements Trello clone. My kanban board project ' +
        'direct relevant experience drag-drop react-dnd websockets real-time collaboration. ' +
        'Happy discuss technical architecture during interview call.';

      const result = service.checkSpam(genuine, [existing]);
      expect(result.isTemplateBid).toBe(false);
    });
  });

  // ─── Vietnamese text ─────────────────────────────────────────────────────────

  describe('Vietnamese text handling', () => {
    it('flags identical Vietnamese cover letters', () => {
      const viLetter =
        'Tôi chuyên gia phát triển web React TypeScript nhiều năm kinh nghiệm. ' +
        'Dự án hoàn thành đúng tiến độ chất lượng cao. Sẵn sàng bắt đầu ngay.';

      const result = service.checkSpam(viLetter, [viLetter]);
      expect(result.isTemplateBid).toBe(true);
      expect(result.spamScore).toBeCloseTo(1, 2);
    });

    it('mixed Vietnamese-English cover letter tokenized correctly', () => {
      const mixed =
        'Developer fullstack kinh nghiệm React NestJS PostgreSQL. ' +
        'Dự án thương mại điện tử hoàn thành xuất sắc. Available immediately.';

      const similar =
        'Developer fullstack kinh nghiệm React NestJS PostgreSQL. ' +
        'Dự án thương mại điện tử hoàn thành tốt. Available start soon.';

      const result = service.checkSpam(mixed, [similar]);
      expect(result.spamScore).toBeGreaterThan(0.7);
    });
  });

  // ─── Score semantics ─────────────────────────────────────────────────────────

  describe('spamScore semantics', () => {
    it('spamScore is in [0, 1]', () => {
      const letters = [
        'frontend developer react vue angular javascript css',
        'backend python django flask sqlalchemy postgresql',
        'devops kubernetes docker aws ci pipeline',
      ];

      for (let i = 0; i < letters.length; i++) {
        const existing = letters.filter((_, j) => j !== i);
        const result = service.checkSpam(letters[i], existing);
        expect(result.spamScore).toBeGreaterThanOrEqual(0);
        expect(result.spamScore).toBeLessThanOrEqual(1);
      }
    });

    it('mostSimilarIndex references index within existingLetters (not offset)', () => {
      const newLetter = 'React developer frontend TypeScript hooks redux state management.';
      const existing = [
        'Python data science pandas tensorflow sklearn neural network.',
        'React developer frontend TypeScript hooks redux state management.',  // idx 1
        'DevOps engineer kubernetes docker aws terraform pipeline.',
      ];

      const result = service.checkSpam(newLetter, existing);
      // mostSimilarIndex should be 1 (zero-based index in existingLetters)
      expect(result.mostSimilarIndex).toBe(1);
    });
  });
});
