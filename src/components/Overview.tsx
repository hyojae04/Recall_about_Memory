import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Coffee,
  Database,
  Fingerprint,
  History,
  Leaf,
  MoveUpRight,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { benchmarkCases, conversations } from '../engine/dataset';
import { CATEGORY_INFO, STRATEGIES, STRATEGY_INFO } from '../engine/types';
import type { BenchmarkRun, Category } from '../engine/types';
import {
  CategoryBadge,
  percent,
  SectionTitle,
  StatusDot,
  StrategyBadge,
  StrategyIcon,
} from './Shared';

export default function Overview({
  run,
  onCase,
  onLab,
  onMethods,
}: {
  run: BenchmarkRun;
  onCase: (id: string) => void;
  onLab: () => void;
  onMethods: () => void;
}) {
  const temporal = run.summaries.find((s) => s.strategy === 'temporal')!;
  const baseline = run.summaries.find((s) => s.strategy === 'recent')!;
  const lexical = run.summaries.find((s) => s.strategy === 'bm25')!;
  const categories = Object.keys(CATEGORY_INFO) as Category[];
  const selectedCases = ['mina-update', 'jun-multi', 'sora-temporal', 'leo-paraphrase'];
  const delta = (temporal.recall - baseline.recall) * 100;

  return (
    <div className="view-enter">
      <div className="overview-intro">
        <div>
          <h1>
            기억의 차이를,
            <br className="mobile-break" /> 직접 확인하세요<span className="orange">.</span>
          </h1>
          <p className="page-description">
            같은 대화, 서로 다른 기억. 세 가지 검색 전략을 근거로 비교합니다.
          </p>
        </div>
        <div className="intro-stamp">
          <Fingerprint size={29} strokeWidth={1.3} />
          <div>
            YOUR DATA.
            <br />
            <strong>YOUR LAB.</strong>
          </div>
        </div>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <div className="metric-top">
            <span>
              근거 회수율 <small>Recall@{run.k}</small>
            </span>
            <Target size={17} />
          </div>
          <div className="metric-value">
            {percent(temporal.recall)}
            <span className="delta">
              <MoveUpRight size={12} />
              {delta.toFixed(0)}%p
            </span>
          </div>
          <div className="metric-foot">
            갱신 인식 검색 <span>최근 대화 대비</span>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span>오래된 기억 혼입</span>
            <History size={17} />
          </div>
          <div className="metric-value">
            {percent(temporal.staleRate)}
            <span className="neutral-chip">
              <ShieldCheck size={12} />
              정정 반영
            </span>
          </div>
          <div className="metric-foot">
            갱신 인식 검색 <span>키워드 검색 {percent(lexical.staleRate)}</span>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span>평가 데이터셋</span>
            <Database size={17} />
          </div>
          <div className="metric-value">
            {benchmarkCases.length}
            <span className="metric-unit">cases</span>
            <span className="dataset-stack" aria-hidden="true">
              {conversations.slice(0, 3).map((c) => (
                <i key={c.id} style={{ background: c.color }}>
                  {c.initials}
                </i>
              ))}
              <i>+5</i>
            </span>
          </div>
          <div className="metric-foot">
            한국어 합성 대화 <span>8개 대화 · 6개 유형</span>
          </div>
        </article>
      </div>

      <div className="analysis-grid">
        <section className="panel comparison-panel">
          <SectionTitle
            title="어떤 기억이 살아남았을까요?"
            action="평가 기준"
            onAction={onMethods}
          />
          <div className="chart-legend">
            {STRATEGIES.map((s) => (
              <StrategyBadge key={s} strategy={s} />
            ))}
          </div>
          <div
            className="chart"
            role="img"
            aria-label={`유형별 완전 통과율. ${run.summaries.map((s) => `${STRATEGY_INFO[s.strategy].name} ${s.successCount}/${s.caseCount}건 통과`).join(', ')}. 상세 수치는 아래 표에서 확인할 수 있습니다.`}
          >
            <div className="chart-y">
              <span>100%</span>
              <span>50%</span>
              <span>0</span>
            </div>
            <div className="chart-plot">
              <div className="chart-gridline top" />
              <div className="chart-gridline middle" />
              <div className="chart-gridline bottom" />
              {categories.map((category) => (
                <div className="bar-category" key={category}>
                  <div className="bar-group">
                    {STRATEGIES.map((s) => {
                      const value = run.summaries.find((item) => item.strategy === s)!.categories[
                        category
                      ];
                      const rate = value.success / value.total;
                      return (
                        <div
                          className={`bar ${s}`}
                          key={s}
                          title={`${STRATEGY_INFO[s].name}: ${percent(rate)}`}
                          style={{
                            height: `${Math.max(rate * 100, 1.5)}%`,
                            opacity: rate === 0 ? 0.3 : 1,
                          }}
                        ></div>
                      );
                    })}
                  </div>
                  <span className="bar-label">{CATEGORY_INFO[category].name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-note">
            <span className="small-dot" />
            완전 통과 = 필요한 근거 모두 검색 + 오래된 근거 없음
          </div>
          <details className="chart-data">
            <summary>차트 데이터 보기</summary>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>유형</th>
                    {STRATEGIES.map((s) => (
                      <th key={s}>{STRATEGY_INFO[s].name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat}>
                      <th>{CATEGORY_INFO[cat].name}</th>
                      {run.summaries.map((s) => (
                        <td key={s.strategy}>
                          {s.categories[cat].success}/{s.categories[cat].total}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
        <section className="insight-panel">
          <h2>
            취향은 바뀌어도,
            <br />
            기억은 따라와야 하니까.
          </h2>
          <div className="memory-story">
            <div className="story-card old">
              <span className="story-date">
                10.01 <span>이전 기억</span>
              </span>
              <p>“아이스 아메리카노를 좋아해.”</p>
              <Coffee className="story-symbol" size={14} aria-hidden="true" />
            </div>
            <div className="story-connector">
              <span />
              <ArrowDown size={15} />
              <span />
            </div>
            <div className="story-card new">
              <span className="story-date">
                10.08{' '}
                <span>
                  <Check size={10} />
                  현재 기억
                </span>
              </span>
              <p>“이제 따뜻한 루이보스차가 좋아.”</p>
              <Leaf className="story-symbol" size={14} aria-hidden="true" />
            </div>
          </div>
          <button className="insight-link" onClick={() => onCase('mina-update')}>
            두 기억의 차이 살펴보기 <ArrowUpRight size={17} />
          </button>
          <span className="insight-caption">실제 데이터셋의 민아 대화에서</span>
        </section>
      </div>

      <section className="panel results-panel">
        <SectionTitle title="숫자 뒤의 대화들" action="플레이그라운드 열기" onAction={onLab} />
        <p className="table-hint">
          옆으로 밀어 세 전략을 비교하세요 <ArrowRight size={12} />
        </p>
        <div className="table-scroll">
          <table className="case-table">
            <thead>
              <tr>
                <th>질문 / 평가 유형</th>
                {STRATEGIES.map((s) => (
                  <th key={s}>
                    <span className="table-strategy">
                      <StrategyIcon strategy={s} size={13} />
                      {STRATEGY_INFO[s].name}
                    </span>
                  </th>
                ))}
                <th>
                  <span className="sr-only">상세 보기</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedCases.map((id) => {
                const test = benchmarkCases.find((item) => item.id === id)!;
                return (
                  <tr key={id}>
                    <td>
                      <button className="case-link" onClick={() => onCase(id)}>
                        {test.query}
                      </button>
                      <CategoryBadge category={test.category} />
                    </td>
                    {STRATEGIES.map((s) => (
                      <td key={s}>
                        <StatusDot
                          success={
                            run.scores.find((score) => score.caseId === id && score.strategy === s)!
                              .success
                          }
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`${test.query} 상세 보기`}
                        onClick={() => onCase(id)}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="bottom-note">
        <span>
          <ShieldCheck size={14} />
          모든 실험은 이 브라우저 안에서 실행됩니다.
        </span>
        <button onClick={onMethods}>
          작은 실험의 한계까지 투명하게 <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
