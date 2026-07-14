import { Injectable } from '@nestjs/common';

// Common Vietnamese + English stopwords
const STOPWORDS = new Set([
  // English
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','being','have','has','had','do',
  'does','did','will','would','could','should','may','might','shall','can',
  'i','you','he','she','it','we','they','me','him','her','us','them',
  'my','your','his','its','our','their','this','that','these','those',
  'what','which','who','how','when','where','why','not','no','if','so',
  // Vietnamese
  'và','của','là','có','không','được','trong','để','này','đó','với','các',
  'một','những','đã','sẽ','cho','từ','khi','thì','đến','hay','hoặc','còn',
  'như','nhưng','về','theo','ra','vào','cũng','bạn','tôi','chúng','họ',
  'mình','ông','bà','anh','em','rất','thế','nên','vì','do','vậy','đây',
  'đó','lên','xuống','lại','đang','đã','sẽ','được','bởi','trên','dưới',
  'trước','sau','giữa','qua','nếu','mà','hơn','ít','nhiều','tất','cả',
]);

const SPAM_THRESHOLD = 0.85;

export interface SpamCheckResult {
  spamScore: number;
  isTemplateBid: boolean;
  mostSimilarIndex: number;
}

@Injectable()
export class NlpSpamService {
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\sÀ-ɏḀ-ỿ]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t));
  }

  private buildTfIdf(docs: string[][]): number[][] {
    if (docs.length === 0) return [];

    // Build vocabulary
    const vocab = new Map<string, number>();
    for (const tokens of docs) {
      for (const t of new Set(tokens)) {
        if (!vocab.has(t)) vocab.set(t, vocab.size);
      }
    }
    const V = vocab.size;
    const N = docs.length;

    // Document frequency per term
    const df = new Array(V).fill(0);
    for (const tokens of docs) {
      const seen = new Set(tokens);
      for (const t of seen) {
        const idx = vocab.get(t);
        if (idx !== undefined) df[idx]++;
      }
    }

    // IDF (smooth): log(1 + N / (1 + df)) + 1
    const idf = df.map((d) => Math.log(1 + N / (1 + d)) + 1);

    // TF-IDF vectors
    return docs.map((tokens) => {
      const vec = new Array(V).fill(0);
      const tfMap = new Map<string, number>();
      for (const t of tokens) {
        tfMap.set(t, (tfMap.get(t) ?? 0) + 1);
      }
      const len = tokens.length || 1;
      for (const [term, cnt] of tfMap) {
        const idx = vocab.get(term);
        if (idx !== undefined) {
          vec[idx] = (cnt / len) * idf[idx];
        }
      }
      return vec;
    });
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * MC-06: Check if a new cover letter is a template/spam bid.
   * @param newCoverLetter  The cover letter to check
   * @param existingLetters All previous cover letters from the same freelancer
   */
  checkSpam(newCoverLetter: string, existingLetters: string[]): SpamCheckResult {
    if (!newCoverLetter?.trim() || existingLetters.length === 0) {
      return { spamScore: 0, isTemplateBid: false, mostSimilarIndex: -1 };
    }

    const allDocs = [newCoverLetter, ...existingLetters].map((t) =>
      this.tokenize(t),
    );

    // Edge case: new doc has no tokens after filtering
    if (allDocs[0].length === 0) {
      return { spamScore: 0, isTemplateBid: false, mostSimilarIndex: -1 };
    }

    const vectors = this.buildTfIdf(allDocs);
    const newVec = vectors[0];

    let maxSimilarity = 0;
    let mostSimilarIndex = -1;

    for (let i = 1; i < vectors.length; i++) {
      const sim = this.cosineSimilarity(newVec, vectors[i]);
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        mostSimilarIndex = i - 1; // index in existingLetters
      }
    }

    return {
      spamScore: Math.round(maxSimilarity * 10000) / 10000,
      isTemplateBid: maxSimilarity >= SPAM_THRESHOLD,
      mostSimilarIndex,
    };
  }
}
