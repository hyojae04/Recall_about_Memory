import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  CornerDownLeft,
  MessageSquare,
  SlidersHorizontal,
} from 'lucide-react';
import { benchmarkCases, conversations, getConversation } from '../engine/dataset';
import { scoreCase } from '../engine/evaluation';
import { retrieve, supersededIds, visibleMemories } from '../engine/retrieval';
import { STRATEGIES, STRATEGY_INFO } from '../engine/types';
import type { BenchmarkCase } from '../engine/types';
import { CategoryBadge, dateLabel, EmptyState, percent, StrategyIcon } from './Shared';

interface QueryState {
  query: string;
  conversationId: string;
  asOf?: string;
  test?: BenchmarkCase;
}

export default function Playground({
  initialCase,
  k,
  onK,
  onMemory,
}: {
  initialCase: string;
  k: number;
  onK: (k: number) => void;
  onMemory: (conversationId: string, memoryId?: string) => void;
}) {
  const initial = benchmarkCases.find((test) => test.id === initialCase) ?? benchmarkCases[0];
  const [text, setText] = useState(initial.query);
  const [conversationId, setConversationId] = useState(initial.conversationId);
  const [asOf, setAsOf] = useState(initial.asOf ? initial.asOf.slice(0, 10) : '');
  const [submitted, setSubmitted] = useState<QueryState>({
    query: initial.query,
    conversationId: initial.conversationId,
    asOf: initial.asOf,
    test: initial,
  });
  const [submission, setSubmission] = useState(0);
  const conversation = getConversation(conversationId);
  const results = useMemo(
    () =>
      STRATEGIES.map((strategy) =>
        retrieve(getConversation(submitted.conversationId).memories, submitted.query, strategy, {
          k,
          asOf: submitted.asOf,
        }),
      ),
    [submitted, k],
  );
  const staleIds = supersededIds(
    visibleMemories(getConversation(submitted.conversationId).memories, submitted.asOf),
  );
  const samples = benchmarkCases.filter((test) => test.conversationId === conversationId);
  const dirty =
    text !== submitted.query ||
    conversationId !== submitted.conversationId ||
    asOf !== (submitted.asOf?.slice(0, 10) ?? '');

  function selectCase(test: BenchmarkCase) {
    setText(test.query);
    setAsOf(test.asOf?.slice(0, 10) ?? '');
    setConversationId(test.conversationId);
    setSubmitted({ query: test.query, conversationId: test.conversationId, asOf: test.asOf, test });
    setSubmission((s) => s + 1);
  }
  function submit() {
    if (!text.trim()) return;
    const cutoff = asOf ? `${asOf}T23:59:59Z` : undefined;
    const test = samples.find((sample) => sample.query === text.trim() && sample.asOf === cutoff);
    setSubmitted({ query: text.trim(), conversationId, asOf: cutoff, test });
    setSubmission((s) => s + 1);
  }

  return (
    <div className="view-enter">
      <div className="page-heading">
        <h1>
          기억에게 물어보세요<span className="orange">.</span>
        </h1>
        <p className="page-description">
          어떤 근거를 찾고, 무엇을 놓치는지. 한 질문으로 나란히 확인하세요.
        </p>
      </div>
      <div className="query-workspace panel">
        <div className="query-context">
          <div className="context-person">
            <span className="avatar" style={{ background: conversation.color }}>
              {conversation.initials}
            </span>
            <div>
              <label htmlFor="conversation-select">대화 선택</label>
              <select
                id="conversation-select"
                value={conversationId}
                onChange={(e) => {
                  const first = benchmarkCases.find(
                    (test) => test.conversationId === e.target.value,
                  )!;
                  selectCase(first);
                }}
              >
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}의 기억
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className="context-count">
            4 sessions <span>·</span> 12 memories
          </span>
          <button className="secondary-button compact" onClick={() => onMemory(conversationId)}>
            <BookOpen size={14} />
            대화 원문
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="sr-only" htmlFor="query">
            기억에 대한 질문
          </label>
          <textarea
            id="query"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="이 대화에서 궁금한 기억을 물어보세요."
            maxLength={500}
            rows={2}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
          />
          <div className="query-toolbar">
            <div className="query-settings">
              <label className="inline-select">
                <SlidersHorizontal size={13} />
                Top K
                <select
                  aria-label="검색 결과 수"
                  value={k}
                  onChange={(e) => onK(Number(e.target.value))}
                >
                  {[1, 3, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="date-setting">
                <Clock3 size={13} />
                <span className="sr-only">조회 시점 UTC</span>
                <input
                  type="date"
                  aria-label="조회 시점 UTC"
                  value={asOf}
                  onChange={(e) => setAsOf(e.target.value)}
                />
                <span className="date-hint">{asOf ? 'UTC 기준' : '현재 시점'}</span>
              </label>
              {asOf && (
                <button className="text-button" type="button" onClick={() => setAsOf('')}>
                  초기화
                </button>
              )}
            </div>
            <button className="primary-button" disabled={!text.trim()} type="submit">
              기억 검색
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
        <div className="query-suggestions">
          <span>이렇게도 물어보세요</span>
          {samples.slice(0, 4).map((test) => (
            <button key={test.id} onClick={() => selectCase(test)}>
              {test.category === 'update'
                ? '바뀐 취향'
                : test.category === 'recall'
                  ? '오래된 기억'
                  : test.category === 'multi'
                    ? '여러 대화 연결'
                    : '과거 시점'}
              <ArrowUpRight size={11} />
            </button>
          ))}
          <span className="keyboard-hint">
            <CornerDownLeft size={12} />⌘ / Ctrl + Enter
          </span>
        </div>
      </div>

      <div className="result-heading">
        <div>
          <h2>같은 질문, 세 가지 기억</h2>
          <p>
            {dirty
              ? '질문이나 시점이 바뀌었습니다. 검색하면 아래 결과가 갱신됩니다.'
              : `“${submitted.query}”`}
          </p>
        </div>
        <span className="quiet-chip">
          <span className="small-dot green" />
          로컬 검색 완료
        </span>
      </div>
      <div className="sr-only" role="status" key={submission}>
        검색 완료. 세 가지 전략의 결과를 표시합니다.
      </div>
      <div className="retrieval-grid" data-testid="retrieval-results">
        {results.map((result) => {
          const strategy = result.strategy;
          const info = STRATEGY_INFO[strategy];
          const score = submitted.test
            ? scoreCase(submitted.test, result, getConversation(submitted.conversationId).memories)
            : null;
          return (
            <section className={`retrieval-panel ${strategy}`} key={strategy}>
              <div className="retrieval-title">
                <span className={`strategy-icon ${strategy}`}>
                  <StrategyIcon strategy={strategy} />
                </span>
                <div>
                  <h3>{info.name}</h3>
                  <span>{info.short}</span>
                </div>
                {strategy === 'temporal' && <span className="method-tag">정정 반영</span>}
              </div>
              <p className="retrieval-description">{info.description}</p>
              <div className="retrieval-meta">
                <span>
                  찾은 기억 <strong>{result.hits.length}</strong>
                </span>
                {score ? (
                  <span className={score.success ? 'success-text' : 'warning-text'}>
                    {score.success ? '완전 통과' : '추가 확인 필요'}
                  </span>
                ) : (
                  <span>자유 질문 · 미채점</span>
                )}
              </div>
              {result.hits.length === 0 ? (
                <EmptyState
                  title="일치하는 근거가 없어요"
                  description="검색어와 겹치는 표현을 찾지 못했습니다. 질문을 바꿔 보세요."
                />
              ) : (
                <div className="evidence-list">
                  {result.hits.map((hit, index) => {
                    const isGold = submitted.test?.evidenceIds.includes(hit.memory.id);
                    const isStale = staleIds.has(hit.memory.id);
                    return (
                      <article
                        className={`evidence-item ${isStale ? 'stale' : ''}`}
                        key={hit.memory.id}
                      >
                        <div className="evidence-label">
                          <span className="evidence-index">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span>
                            {dateLabel(hit.memory.timestamp)} · 대화 {hit.memory.session}
                          </span>
                          {isStale ? (
                            <span className="evidence-tag stale">이전 정보</span>
                          ) : isGold ? (
                            <span className="evidence-tag gold">
                              <Check size={10} />
                              정답 근거
                            </span>
                          ) : null}
                        </div>
                        <p>{hit.memory.text}</p>
                        <button
                          onClick={() => onMemory(submitted.conversationId, hit.memory.id)}
                          className="evidence-source"
                        >
                          <MessageSquare size={12} />
                          {hit.memory.id}
                          <ArrowUpRight size={12} />
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
              <div className="retrieval-footer">
                {strategy === 'temporal'
                  ? `${result.excludedIds.length}개 정정된 기억 제외`
                  : `${result.visibleCount}개 기억에서 검색`}
                {score && score.recall !== null && <span>Recall {percent(score.recall)}</span>}
              </div>
            </section>
          );
        })}
      </div>
      {submitted.test && (
        <section className="reference-panel">
          <div>
            <span className="reference-icon">
              <BookOpen size={18} />
            </span>
            <div>
              <h3>
                평가용 정답 근거 <CategoryBadge category={submitted.test.category} />
              </h3>
              <p>{submitted.test.reference}</p>
            </div>
          </div>
          <p>
            {submitted.test.explanation} 정답 레이블은 채점에만 사용하며 검색 엔진에는 전달하지
            않습니다.
          </p>
        </section>
      )}
      <p className="fine-print">
        이 화면은 기억 검색 결과를 보여줍니다. LLM 응답을 생성하지 않으며, 자유 질문은 정답 근거가
        없어 점수를 매기지 않습니다.
      </p>
    </div>
  );
}
