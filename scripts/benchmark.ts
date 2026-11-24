import { mkdir, writeFile } from 'node:fs/promises';
import { runBenchmark } from '../src/engine/evaluation';
import { STRATEGY_INFO } from '../src/engine/types';

const run = runBenchmark(3);
await mkdir('docs', { recursive: true });
await writeFile('docs/benchmark-results.json', JSON.stringify(run, null, 2) + '\n');
console.table(
  run.summaries.map((s) => ({
    strategy: STRATEGY_INFO[s.strategy].short,
    'Recall@3': s.recall.toFixed(3),
    MRR: s.mrr.toFixed(3),
    staleRate: s.staleRate.toFixed(3),
    abstention: s.abstentionAccuracy.toFixed(3),
    passed: `${s.successCount}/${s.caseCount}`,
  })),
);
console.log(`Saved docs/benchmark-results.json (${run.scores.length} evaluations)`);
