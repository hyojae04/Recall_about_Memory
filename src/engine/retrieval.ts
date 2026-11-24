import type { Memory, SearchOptions, SearchResult, Strategy } from './types';

const STOP_WORDS = new Set([
  '내',
  '내가',
  '나',
  '나는',
  '우리',
  '그',
  '그때',
  '지금',
  '현재',
  '요즘',
  '뭐',
  '뭐야',
  '뭐였어',
  '어디야',
  '언제야',
  '얼마야',
  '알려줘',
  '기억해',
  '줘',
  '꼭',
  '수',
  '있어',
  '이제',
  '정말',
  '어떤',
  '뭘',
  '몇',
  '중',
  '걸',
  '이름을',
]);

/** Modest Korean lexical tokenizer: particles + character bigrams, not semantics. */
export function tokenize(text: string): string[] {
  const words =
    text
      .normalize('NFKC')
      .toLowerCase()
      .match(/[a-z0-9]+|[가-힣]+/g) ?? [];
  return words.flatMap((word) => {
    if (STOP_WORDS.has(word)) return [];
    const base =
      word.length > 2
        ? word.replace(/(에서는|에서|으로|에게|하고|은|는|을|를|이|가|와|과|에|도|야)$/, '')
        : word;
    if (STOP_WORDS.has(base) || base.length < 2) return [];
    if (/^[가-힣]{3,}$/.test(base)) {
      return [base, ...Array.from({ length: base.length - 1 }, (_, i) => base.slice(i, i + 2))];
    }
    return [base];
  });
}

export function visibleMemories(memories: Memory[], asOf?: string): Memory[] {
  if (asOf && !Number.isFinite(Date.parse(asOf))) throw new Error('Invalid as-of timestamp');
  const cutoff = asOf ? Date.parse(asOf) : Infinity;
  return memories.filter((m) => Date.parse(m.timestamp) <= cutoff);
}

export function supersededIds(memories: Memory[]): Set<string> {
  const byId = new Map(memories.map((m) => [m.id, m]));
  return new Set(
    memories.flatMap((m) => {
      const prior = m.supersedes ? byId.get(m.supersedes) : undefined;
      // A correction can only replace an existing earlier memory in this corpus.
      return prior && Date.parse(prior.timestamp) < Date.parse(m.timestamp) ? [prior.id] : [];
    }),
  );
}

function lexicalScores(memories: Memory[], query: string) {
  const queryTerms = [...new Set(tokenize(query))];
  const documents = memories.map((memory) => ({ memory, terms: tokenize(memory.text) }));
  const averageLength =
    documents.reduce((total, doc) => total + doc.terms.length, 0) / (documents.length || 1);
  const frequencies = new Map<string, number>();
  for (const doc of documents) {
    for (const term of new Set(doc.terms)) frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
  }
  const k1 = 1.2;
  const b = 0.75;
  return documents
    .map(({ memory, terms }) => {
      let score = 0;
      for (const term of queryTerms) {
        const tf = terms.filter((t) => t === term).length;
        const df = frequencies.get(term) ?? 0;
        const idf = Math.log(1 + (documents.length - df + 0.5) / (df + 0.5));
        if (tf)
          score +=
            (idf * (tf * (k1 + 1))) /
            (tf + k1 * (1 - b + (b * terms.length) / (averageLength || 1)));
      }
      return { memory, score };
    })
    .filter((hit) => hit.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Date.parse(b.memory.timestamp) - Date.parse(a.memory.timestamp) ||
        a.memory.id.localeCompare(b.memory.id),
    );
}

/** Retrieval accepts only the corpus, query and settings; never gold labels. */
export function retrieve(
  memories: Memory[],
  query: string,
  strategy: Strategy,
  options: SearchOptions,
): SearchResult {
  if (!Number.isInteger(options.k) || options.k < 1 || options.k > 10)
    throw new Error('k must be an integer from 1 to 10');
  const start = performance.now();
  const visible = visibleMemories(memories, options.asOf);
  const excluded = strategy === 'temporal' ? supersededIds(visible) : new Set<string>();
  const candidates = visible.filter((m) => !excluded.has(m.id));
  const hits = !query.trim()
    ? []
    : strategy === 'recent'
      ? [...candidates]
          .sort(
            (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp) || a.id.localeCompare(b.id),
          )
          .slice(0, options.k)
          .map((memory, i) => ({ memory, score: 1 / (i + 1) }))
      : lexicalScores(candidates, query).slice(0, options.k);
  return {
    strategy,
    hits,
    excludedIds: [...excluded],
    visibleCount: visible.length,
    elapsedMs: performance.now() - start,
  };
}
