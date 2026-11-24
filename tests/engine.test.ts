import { describe, expect, it } from 'vitest';
import { benchmarkCases, conversations, getConversation } from '../src/engine/dataset';
import { evaluateCase, runBenchmark, scoreCase, summarize } from '../src/engine/evaluation';
import { retrieve, supersededIds, tokenize, visibleMemories } from '../src/engine/retrieval';
import { STRATEGIES } from '../src/engine/types';
import type { BenchmarkCase, Memory, SearchResult } from '../src/engine/types';

const memories: Memory[] = [
  {
    id: 'old',
    text: '선호하는 음료는 커피야. 커피 음료를 좋아해.',
    timestamp: '2026-01-01T00:00:00Z',
    session: 1,
  },
  {
    id: 'job',
    text: '내 직장은 성수동 디자인 스튜디오야.',
    timestamp: '2026-01-02T00:00:00Z',
    session: 1,
  },
  {
    id: 'new',
    text: '음료는 루이보스차로 바꿨어.',
    timestamp: '2026-01-03T00:00:00Z',
    session: 2,
    supersedes: 'old',
  },
  { id: 'noise', text: '주말에는 숲에서 산책했어.', timestamp: '2026-01-04T00:00:00Z', session: 2 },
];
const fixture: BenchmarkCase = {
  id: 'test',
  conversationId: 'fixture',
  query: '음료',
  category: 'update',
  evidenceIds: ['new'],
  reference: '차',
  explanation: 'fixture',
};
function result(ids: string[]): SearchResult {
  return {
    strategy: 'bm25',
    hits: ids.map((id) => ({ memory: memories.find((m) => m.id === id)!, score: 1 })),
    elapsedMs: 0,
    excludedIds: [],
    visibleCount: 4,
  };
}

describe('retrieval behavior', () => {
  it('recent baseline returns the latest K, regardless of query overlap', () => {
    expect(retrieve(memories, '음료', 'recent', { k: 2 }).hits.map((h) => h.memory.id)).toEqual([
      'noise',
      'new',
    ]);
  });
  it('lexical search can retrieve a relevant memory outside the recent window', () => {
    expect(retrieve(memories, '직장은 어디야?', 'bm25', { k: 1 }).hits[0].memory.id).toBe('job');
  });
  it('keeps obsolete matching evidence in the BM25 baseline', () => {
    expect(retrieve(memories, '음료', 'bm25', { k: 3 }).hits.map((h) => h.memory.id)).toContain(
      'old',
    );
  });
  it('excludes a superseded memory before lexical ranking', () => {
    const found = retrieve(memories, '음료', 'temporal', { k: 3 });
    expect(found.hits.map((h) => h.memory.id)).toEqual(['new']);
    expect(found.excludedIds).toEqual(['old']);
  });
  it('cannot use a correction from the future', () => {
    const found = retrieve(memories, '음료', 'temporal', { k: 3, asOf: '2026-01-02T23:59:59Z' });
    expect(found.hits.map((h) => h.memory.id)).toEqual(['old']);
    expect(found.excludedIds).toEqual([]);
  });
  it('includes an event exactly at the cutoff', () => {
    expect(visibleMemories(memories, '2026-01-03T00:00:00Z').map((m) => m.id)).toEqual([
      'old',
      'job',
      'new',
    ]);
  });
  it('honors the cutoff for all three strategies', () => {
    for (const strategy of STRATEGIES)
      expect(
        retrieve(memories, '음료', strategy, { k: 5, asOf: '2026-01-02T23:59:59Z' }).hits.every(
          (hit) => Date.parse(hit.memory.timestamp) <= Date.parse('2026-01-02T23:59:59Z'),
        ),
      ).toBe(true);
  });
  it('returns no match for unrelated lexical questions', () => {
    expect(retrieve(memories, '여권 번호', 'bm25', { k: 3 }).hits).toEqual([]);
  });
  it('documents that lexical overlap can cause a false positive on unanswerable questions', () => {
    const unanswerable = { ...fixture, evidenceIds: [], query: '직장 연봉' };
    const found = retrieve(memories, unanswerable.query, 'temporal', { k: 3 });
    expect(found.hits.length).toBeGreaterThan(0);
    expect(scoreCase(unanswerable, found, memories).abstentionCorrect).toBe(false);
  });
  it('returns empty results for an empty query or empty corpus', () => {
    for (const strategy of STRATEGIES) {
      expect(retrieve(memories, '  ', strategy, { k: 3 }).hits).toEqual([]);
      expect(retrieve([], '음료', strategy, { k: 3 }).hits).toEqual([]);
    }
  });
  it('rejects invalid K and malformed timestamps', () => {
    for (const k of [0, -1, 1.5, 11, NaN])
      expect(() => retrieve(memories, '음료', 'bm25', { k })).toThrow();
    expect(() => retrieve(memories, '음료', 'temporal', { k: 3, asOf: 'invalid' })).toThrow();
  });
  it('does not mutate the input corpus', () => {
    const original = structuredClone(memories);
    for (const strategy of STRATEGIES) retrieve(memories, '음료', strategy, { k: 3 });
    expect(memories).toEqual(original);
  });
  it('resolves correction chains and ignores invalid backwards references', () => {
    const chain = [
      ...memories,
      {
        id: 'newest',
        text: '음료는 물',
        timestamp: '2026-01-05T00:00:00Z',
        session: 3,
        supersedes: 'new',
      },
    ];
    expect([...supersededIds(chain)]).toEqual(['old', 'new']);
    expect(supersededIds([{ ...memories[0], supersedes: 'new' }, memories[2]])).toEqual(
      new Set(['old']),
    );
    expect(supersededIds([{ ...memories[0], supersedes: 'missing' }]).size).toBe(0);
  });
  it('normalizes latin case and Korean particles', () => {
    expect(tokenize('TypeScript')).toEqual(tokenize('TYPESCRIPT'));
    expect(tokenize('직장은')).toContain('직장');
    expect(tokenize('직장과')).toContain('직장');
  });
  it('does not treat paraphrases as semantic matches', () => {
    expect(retrieve([memories[0]], '카페에서 주문할 것', 'bm25', { k: 3 }).hits).toEqual([]);
  });
});

describe('evaluation correctness', () => {
  it('requires all evidence for a complete multi-session pass', () => {
    const multi = { ...fixture, category: 'multi' as const, evidenceIds: ['job', 'new'] };
    expect(scoreCase(multi, result(['job']), memories)).toMatchObject({
      recall: 0.5,
      reciprocalRank: 1,
      success: false,
    });
    expect(scoreCase(multi, result(['job', 'new']), memories)).toMatchObject({
      recall: 1,
      reciprocalRank: 1,
      success: true,
    });
  });
  it('scores missing and second-rank evidence correctly', () => {
    expect(scoreCase(fixture, result(['noise']), memories)).toMatchObject({
      recall: 0,
      reciprocalRank: 0,
    });
    expect(scoreCase(fixture, result(['noise', 'new']), memories)).toMatchObject({
      recall: 1,
      reciprocalRank: 0.5,
    });
  });
  it('counts obsolete evidence as failure even when recall is perfect', () => {
    expect(scoreCase(fixture, result(['new', 'old']), memories)).toMatchObject({
      recall: 1,
      staleCount: 1,
      success: false,
    });
  });
  it('does not mark historically valid evidence as stale', () => {
    expect(
      scoreCase(
        { ...fixture, evidenceIds: ['old'], asOf: '2026-01-02T23:59:59Z' },
        result(['old']),
        memories,
      ),
    ).toMatchObject({ recall: 1, staleCount: 0, success: true });
  });
  it('separates abstention from recall denominators', () => {
    const abstention = scoreCase({ ...fixture, evidenceIds: [] }, result([]), memories);
    expect(abstention).toMatchObject({
      recall: null,
      reciprocalRank: null,
      abstentionCorrect: true,
      success: true,
    });
    const summary = summarize([scoreCase(fixture, result(['new']), memories), abstention]).find(
      (s) => s.strategy === 'bm25',
    )!;
    expect(summary).toMatchObject({ recall: 1, mrr: 1, abstentionAccuracy: 1 });
  });
  it('computes stale rate over retrieved evidence, not case count', () => {
    const scores = [
      scoreCase(fixture, result(['old', 'new']), memories),
      scoreCase(fixture, result(['noise']), memories),
    ];
    expect(summarize(scores).find((s) => s.strategy === 'bm25')!.staleRate).toBeCloseTo(1 / 3);
  });
  it('changing gold labels cannot alter retrieved results', () => {
    const test = benchmarkCases[0];
    const before = evaluateCase(test, 3);
    const after = evaluateCase({ ...test, evidenceIds: [], reference: 'arbitrary' }, 3);
    expect(after.map((s) => s.result.hits)).toEqual(before.map((s) => s.result.hits));
    expect(after.map((s) => s.recall)).not.toEqual(before.map((s) => s.recall));
  });
});

describe('dataset and reproducibility', () => {
  it('has 48 unique questions, 8 conversations, and 96 unique memories', () => {
    expect(benchmarkCases).toHaveLength(48);
    expect(conversations).toHaveLength(8);
    expect(new Set(benchmarkCases.map((test) => test.id)).size).toBe(48);
    expect(new Set(conversations.flatMap((c) => c.memories.map((m) => m.id))).size).toBe(96);
  });
  it('all gold evidence exists, is visible, and is not already superseded', () => {
    for (const test of benchmarkCases) {
      const visible = visibleMemories(getConversation(test.conversationId).memories, test.asOf);
      const stale = supersededIds(visible);
      for (const id of test.evidenceIds) {
        expect(visible.some((m) => m.id === id)).toBe(true);
        expect(stale.has(id)).toBe(false);
      }
    }
  });
  it('is deterministic apart from recorded timings and wall-clock metadata', () => {
    const first = runBenchmark(3),
      second = runBenchmark(3);
    const stable = (run: ReturnType<typeof runBenchmark>) =>
      run.scores.map(({ result, ...score }) => ({
        ...score,
        hits: result.hits,
        excluded: result.excludedIds,
      }));
    expect(stable(first)).toEqual(stable(second));
    expect(first.scores).toHaveLength(144);
    expect(
      first.summaries.every((s) => Number.isFinite(s.recall) && s.recall >= 0 && s.recall <= 1),
    ).toBe(true);
  });
  it('reports real progress across all cases', () => {
    const calls: number[] = [];
    runBenchmark(1, (completed, total) => {
      expect(total).toBe(48);
      calls.push(completed);
    });
    expect(calls).toEqual(Array.from({ length: 48 }, (_, i) => i + 1));
  });
  it('keeps deliberately hard failure cases in the benchmark', () => {
    const run = runBenchmark(3);
    expect(
      run.scores.some(
        (s) => s.strategy === 'temporal' && s.category === 'paraphrase' && !s.success,
      ),
    ).toBe(true);
    expect(
      run.scores.some(
        (s) => s.strategy === 'temporal' && s.category === 'abstention' && !s.success,
      ),
    ).toBe(true);
  });
});
