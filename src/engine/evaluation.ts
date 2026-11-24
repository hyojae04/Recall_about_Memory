import { benchmarkCases, DATASET_VERSION, getConversation } from './dataset';
import { retrieve, supersededIds, visibleMemories } from './retrieval';
import { CATEGORY_INFO, STRATEGIES } from './types';
import type {
  BenchmarkCase,
  BenchmarkRun,
  CaseScore,
  Memory,
  SearchResult,
  StrategySummary,
} from './types';

export function scoreCase(
  test: BenchmarkCase,
  result: SearchResult,
  memories: Memory[],
): CaseScore {
  const gold = new Set(test.evidenceIds);
  const retrieved = new Set(result.hits.map((hit) => hit.memory.id));
  const found = [...gold].filter((id) => retrieved.has(id)).length;
  const rank = result.hits.findIndex((hit) => gold.has(hit.memory.id));
  const stale = supersededIds(visibleMemories(memories, test.asOf));
  const staleCount = [...retrieved].filter((id) => stale.has(id)).length;
  const recall = gold.size ? found / gold.size : null;
  const abstentionCorrect = gold.size ? null : result.hits.length === 0;
  return {
    caseId: test.id,
    category: test.category,
    strategy: result.strategy,
    recall,
    reciprocalRank: gold.size ? (rank < 0 ? 0 : 1 / (rank + 1)) : null,
    staleCount,
    retrievedCount: retrieved.size,
    abstentionCorrect,
    success: gold.size ? recall === 1 && staleCount === 0 : abstentionCorrect!,
    result,
  };
}

export function summarize(scores: CaseScore[]): StrategySummary[] {
  return STRATEGIES.map((strategy) => {
    const group = scores.filter((score) => score.strategy === strategy);
    const answered = group.filter((score) => score.recall !== null);
    const unanswerable = group.filter((score) => score.abstentionCorrect !== null);
    const retrievedCount = group.reduce((total, score) => total + score.retrievedCount, 0);
    const categories = Object.fromEntries(
      Object.keys(CATEGORY_INFO).map((category) => {
        const cases = group.filter((score) => score.category === category);
        return [
          category,
          { success: cases.filter((score) => score.success).length, total: cases.length },
        ];
      }),
    ) as StrategySummary['categories'];
    return {
      strategy,
      recall: answered.reduce((total, score) => total + score.recall!, 0) / (answered.length || 1),
      mrr:
        answered.reduce((total, score) => total + score.reciprocalRank!, 0) /
        (answered.length || 1),
      staleRate:
        group.reduce((total, score) => total + score.staleCount, 0) / (retrievedCount || 1),
      abstentionAccuracy:
        unanswerable.filter((score) => score.abstentionCorrect).length / (unanswerable.length || 1),
      successCount: group.filter((score) => score.success).length,
      caseCount: group.length,
      averageMs:
        group.reduce((total, score) => total + score.result.elapsedMs, 0) / (group.length || 1),
      categories,
    };
  });
}

export function evaluateCase(test: BenchmarkCase, k: number): CaseScore[] {
  const { memories } = getConversation(test.conversationId);
  return STRATEGIES.map((strategy) =>
    scoreCase(test, retrieve(memories, test.query, strategy, { k, asOf: test.asOf }), memories),
  );
}

export function runBenchmark(
  k = 3,
  onProgress?: (completed: number, total: number) => void,
): BenchmarkRun {
  const start = performance.now();
  const startedAt = new Date().toISOString();
  const scores = benchmarkCases.flatMap((test, i) => {
    const result = evaluateCase(test, k);
    onProgress?.(i + 1, benchmarkCases.length);
    return result;
  });
  return {
    schemaVersion: 1,
    datasetVersion: DATASET_VERSION,
    startedAt,
    k,
    durationMs: performance.now() - start,
    scores,
    summaries: summarize(scores),
  };
}
