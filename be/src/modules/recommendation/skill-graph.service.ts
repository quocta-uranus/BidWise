import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Shared stopwords (EN + VI) — same set as NlpSpamService
const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','have','has','had','do','does',
  'did','will','would','could','should','may','might','i','you','he','she',
  'it','we','they','me','him','her','us','them','my','your','his','its',
  'our','their','this','that','these','those','what','which','who','not',
  'no','if','so','as','up','out','about','into','than','then','when',
  'và','của','là','có','không','được','trong','để','này','đó','với','các',
  'một','những','đã','sẽ','cho','từ','khi','thì','đến','hay','hoặc','còn',
  'như','nhưng','về','theo','ra','vào','cũng','bạn','tôi','chúng','họ',
  'mình','rất','nên','vì','do','vậy','đây','lên','xuống','lại','đang',
]);

export interface TfIdfVector {
  vocab: Map<string, number>; // term → index
  vectors: number[][];
}

@Injectable()
export class SkillGraphService {
  constructor(private prisma: PrismaService) {}

  // MC-08: Tokenize a text into meaningful tokens
  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\sÀ-ɏḀ-ỿ+#.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter((t) => t.length > 1 && !STOPWORDS.has(t));
  }

  // MC-08: Build a single document string from freelancer profile data
  buildFreelancerDocument(data: {
    skills: string[];
    bio?: string | null;
    portfolioTitles: string[];
    portfolioDescs: string[];
    assessmentLevel?: string | null;
  }): string {
    // Skills get extra weight by repeating 3x
    const skillText = data.skills.join(' ').repeat(3);
    const portfolioText = [
      ...data.portfolioTitles,
      ...data.portfolioDescs,
    ].join(' ');
    const bioText = data.bio ?? '';
    const assessText = data.assessmentLevel ?? '';
    return [skillText, portfolioText, bioText, assessText]
      .filter(Boolean)
      .join(' ');
  }

  // Build a document string from job data
  buildJobDocument(data: {
    title: string;
    description: string;
    skills: string[];
  }): string {
    // Skills get extra weight by repeating 3x
    const skillText = data.skills.join(' ').repeat(3);
    return [data.title, skillText, data.description].join(' ');
  }

  // MC-08: Compute TF-IDF vectors for N documents, return vocab + vectors
  buildTfIdfVectors(docs: string[]): TfIdfVector {
    const tokenizedDocs = docs.map((d) => this.tokenize(d));
    const N = tokenizedDocs.length;

    // Build vocabulary
    const vocab = new Map<string, number>();
    for (const tokens of tokenizedDocs) {
      for (const t of tokens) {
        if (!vocab.has(t)) vocab.set(t, vocab.size);
      }
    }
    const V = vocab.size;

    // DF per term
    const df = new Array(V).fill(0);
    for (const tokens of tokenizedDocs) {
      for (const t of new Set(tokens)) {
        const idx = vocab.get(t);
        if (idx !== undefined) df[idx]++;
      }
    }

    // Smooth IDF: log(1 + N / (1 + df)) + 1
    const idf = df.map((d) => Math.log(1 + N / (1 + d)) + 1);

    // TF-IDF vectors
    const vectors = tokenizedDocs.map((tokens) => {
      const vec = new Array(V).fill(0);
      const tfMap = new Map<string, number>();
      for (const t of tokens) tfMap.set(t, (tfMap.get(t) ?? 0) + 1);
      const len = tokens.length || 1;
      for (const [term, cnt] of tfMap) {
        const idx = vocab.get(term);
        if (idx !== undefined) vec[idx] = (cnt / len) * idf[idx];
      }
      return vec;
    });

    return { vocab, vectors };
  }

  // MC-09: Cosine similarity between two equal-length vectors
  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  // MC-08: Build + cache freelancer skill vector in DB
  async buildAndCacheVector(freelancerId: string): Promise<void> {
    const profile = await this.prisma.freelancerProfile.findUnique({
      where: { userId: freelancerId },
      include: {
        portfolioItems: { select: { title: true, desc: true } },
        user: { select: { bio: true } },
      },
    });
    if (!profile) return;

    const doc = this.buildFreelancerDocument({
      skills: profile.skills,
      bio: profile.user.bio,
      portfolioTitles: profile.portfolioItems.map((p) => p.title),
      portfolioDescs: profile.portfolioItems.map((p) => p.desc),
      assessmentLevel: profile.assessmentLevel,
    });

    // Store as token-frequency map (lightweight, IDF applied at query time)
    const tokens = this.tokenize(doc);
    const tfMap: Record<string, number> = {};
    for (const t of tokens) tfMap[t] = (tfMap[t] ?? 0) + 1;

    await this.prisma.freelancerProfile.update({
      where: { userId: freelancerId },
      data: { skillVector: tfMap },
    });
  }

  // Load freelancer document (from cache or rebuild)
  async getFreelancerDocument(freelancerId: string): Promise<string> {
    const profile = await this.prisma.freelancerProfile.findUnique({
      where: { userId: freelancerId },
      include: {
        portfolioItems: { select: { title: true, desc: true } },
        user: { select: { bio: true } },
      },
    });
    if (!profile) return '';

    return this.buildFreelancerDocument({
      skills: profile.skills,
      bio: profile.user.bio,
      portfolioTitles: profile.portfolioItems.map((p) => p.title),
      portfolioDescs: profile.portfolioItems.map((p) => p.desc),
      assessmentLevel: profile.assessmentLevel,
    });
  }
}
