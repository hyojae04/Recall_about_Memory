export type Strategy = 'recent' | 'bm25' | 'temporal';
export type Category = 'update' | 'recall' | 'multi' | 'temporal' | 'abstention' | 'paraphrase';

export interface Memory {
  id: string;
  text: string;
  timestamp: string;
  session: number;
  /** Human-authored ingestion metadata, never derived from a benchmark answer. */
  supersedes?: string;
}

export interface Conversation {
  id: string;
  name: string;
  subtitle: string;
  initials: string;
  color: string;
  memories: Memory[];
}

export interface BenchmarkCase {
  id: string;
  conversationId: string;
  category: Category;
  query: string;
  asOf?: string;
  evidenceIds: string[];
  reference: string;
  explanation: string;
}

export interface SearchOptions {
  k: number;
  asOf?: string;
}
export interface SearchHit {
  memory: Memory;
  score: number;
}
export interface SearchResult {
  strategy: Strategy;
  hits: SearchHit[];
  excludedIds: string[];
  visibleCount: number;
  elapsedMs: number;
}
export interface CaseScore {
  caseId: string;
  category: Category;
  strategy: Strategy;
  recall: number | null;
  reciprocalRank: number | null;
  staleCount: number;
  retrievedCount: number;
  abstentionCorrect: boolean | null;
  success: boolean;
  result: SearchResult;
}
export interface StrategySummary {
  strategy: Strategy;
  recall: number;
  mrr: number;
  staleRate: number;
  abstentionAccuracy: number;
  successCount: number;
  caseCount: number;
  averageMs: number;
  categories: Record<Category, { success: number; total: number }>;
}
export interface BenchmarkRun {
  schemaVersion: 1;
  datasetVersion: string;
  startedAt: string;
  k: number;
  durationMs: number;
  summaries: StrategySummary[];
  scores: CaseScore[];
}

export const STRATEGIES: Strategy[] = ['recent', 'bm25', 'temporal'];
export const STRATEGY_INFO: Record<
  Strategy,
  { name: string; short: string; description: string; color: string }
> = {
  recent: {
    name: '최근 대화',
    short: 'Recent window',
    description: '가장 최근에 남긴 기억부터 가져옵니다.',
    color: '#939bac',
  },
  bm25: {
    name: '키워드 검색',
    short: 'BM25 retrieval',
    description: '질문과 단어가 겹치는 기억을 찾습니다.',
    color: '#8b7abe',
  },
  temporal: {
    name: '갱신 인식 검색',
    short: 'Update-aware BM25',
    description: '정정된 기억을 제외하고 근거를 찾습니다.',
    color: '#dc5932',
  },
};
export const CATEGORY_INFO: Record<Category, { name: string; description: string }> = {
  update: { name: '정보 갱신', description: '바뀐 취향을 현재 정보로 기억할까요?' },
  recall: { name: '오래된 기억', description: '최근 대화 밖의 정보도 찾을까요?' },
  multi: { name: '여러 대화 연결', description: '서로 다른 대화의 근거를 함께 찾을까요?' },
  temporal: { name: '시점 이해', description: '그때 알고 있던 사실만 가져올까요?' },
  abstention: { name: '모르는 정보', description: '근거가 없으면 검색을 멈출까요?' },
  paraphrase: { name: '다르게 물어보기', description: '표현이 달라도 같은 의미를 찾을까요?' },
};
