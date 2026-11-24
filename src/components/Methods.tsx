import { ArrowRight, ArrowUpRight, BookOpen, Code2, ShieldCheck } from 'lucide-react';
import type { BenchmarkRun } from '../engine/types';
import { STRATEGY_INFO } from '../engine/types';
import { percent, StrategyIcon } from './Shared';

export default function Methods({ run }: { run: BenchmarkRun }) {
  return (
    <div className="view-enter methods-page">
      <div className="page-heading">
        <h1>
          좋은 기억의 기준<span className="orange">.</span>
        </h1>
        <p className="page-description">숫자가 의미하는 것과, 아직 말해 주지 못하는 것.</p>
      </div>
      <section className="method-lead">
        <BookOpen size={26} strokeWidth={1.5} />
        <div>
          <h2>검색과 생성은 다른 문제입니다.</h2>
          <p>
            Recall은 질문에 필요한 <strong>대화 근거를 찾는 과정</strong>을 평가합니다. 모델의 답변
            정확도, 감정 이해, 캐릭터 일관성을 평가하는 도구는 아닙니다. 모든 결과는 현재 데이터와
            설정으로 직접 계산합니다.
          </p>
        </div>
      </section>
      <section className="panel method-section">
        <h2>세 가지 검색 전략</h2>
        <div className="strategy-explanations">
          {run.summaries.map((summary) => (
            <article key={summary.strategy}>
              <span className={`strategy-icon ${summary.strategy}`}>
                <StrategyIcon strategy={summary.strategy} />
              </span>
              <div>
                <h3>
                  {STRATEGY_INFO[summary.strategy].name}
                  <small>{STRATEGY_INFO[summary.strategy].short}</small>
                </h3>
                <p>
                  {summary.strategy === 'recent'
                    ? '조회 시점 이전의 기억을 시간 역순으로 정렬해 K개를 가져옵니다. 질문과의 관련성은 판단하지 않는 기본 비교군입니다.'
                    : summary.strategy === 'bm25'
                      ? '한국어 조사 제거와 글자 bigram으로 토큰화한 뒤 BM25(k₁=1.2, b=0.75) 점수로 정렬합니다. 점수가 0보다 큰 결과만 가져옵니다.'
                      : '조회 시점까지 알려진 supersedes 관계로 이전 기억을 제외하고 BM25를 적용합니다. 정정 관계는 데이터 작성 시 사람이 표시한 메타데이터이며, AI가 자동 추론한 결과가 아닙니다.'}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="panel method-section">
        <h2>측정값 읽기</h2>
        <div className="table-scroll">
          <table className="methods-table">
            <thead>
              <tr>
                <th>지표</th>
                <th>계산</th>
                <th>해석</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Recall@K</th>
                <td>찾은 정답 근거 수 / 전체 정답 근거 수</td>
                <td>근거가 있는 40개 질문의 평균. 높을수록 좋습니다.</td>
              </tr>
              <tr>
                <th>MRR</th>
                <td>첫 정답 근거 순위의 역수 평균</td>
                <td>정답을 못 찾으면 0. 근거 없는 질문은 제외합니다.</td>
              </tr>
              <tr>
                <th>오래된 기억 혼입</th>
                <td>정정된 근거 수 / 검색한 전체 근거 수</td>
                <td>조회 시점에 이미 정정된 기억의 비율. 낮을수록 좋습니다.</td>
              </tr>
              <tr>
                <th>검색 보류 정확도</th>
                <td>검색 결과가 빈 질문 수 / 근거 없는 8개 질문</td>
                <td>근거가 없을 때 멈췄는지 측정합니다.</td>
              </tr>
              <tr>
                <th>완전 통과</th>
                <td>모든 정답 근거 검색 + 오래된 근거 없음</td>
                <td>근거 없는 질문은 결과가 비어 있어야 통과합니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel method-section">
        <h2>
          이번 실행의 전체 결과 <span className="quiet-chip">K = {run.k}</span>
        </h2>
        <div className="table-scroll">
          <table className="methods-table">
            <thead>
              <tr>
                <th>전략</th>
                <th>Recall</th>
                <th>MRR</th>
                <th>오래된 기억</th>
                <th>검색 보류</th>
                <th>완전 통과</th>
              </tr>
            </thead>
            <tbody>
              {run.summaries.map((s) => (
                <tr key={s.strategy}>
                  <th>{STRATEGY_INFO[s.strategy].name}</th>
                  <td>{percent(s.recall)}</td>
                  <td>{s.mrr.toFixed(3)}</td>
                  <td>{percent(s.staleRate)}</td>
                  <td>{percent(s.abstentionAccuracy)}</td>
                  <td>
                    {s.successCount} / {s.caseCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine-print">
          실행 시간 {run.durationMs.toFixed(2)}ms ·{' '}
          {new Date(run.startedAt).toLocaleString('ko-KR')} · 시간 측정은 기기 및 실행 환경에 따라
          달라집니다.
        </p>
      </section>
      <section className="limitations">
        <ShieldCheck size={20} />
        <div>
          <h2>이 실험의 한계</h2>
          <p>
            48개 질문은 8개 대화 템플릿에서 파생되어 서로 독립적이지 않습니다. 학습·검증용 데이터
            분리와 통계적 유의성 검증을 하지 않았습니다. 갱신 인식 방식에는 정정 메타데이터가 추가로
            주어지므로, 순수한 검색 알고리즘의 공정한 우열 비교로 해석할 수 없습니다.
          </p>
          <p>
            동의어, 함축, 복잡한 부정은 어휘 검색만으로 해결하지 못합니다. 검색 보류도 의미 이해가
            아닌 단어 일치 유무로 판단합니다. 높은 점수를 실제 LLM이나 상용 메모리 시스템의 성능으로
            일반화하면 안 됩니다.
          </p>
        </div>
      </section>
      <div className="method-links">
        <a href="https://github.com/xiaowu0162/LongMemEval" target="_blank" rel="noreferrer">
          <BookOpen size={17} />
          <span>
            <strong>LongMemEval</strong>평가 유형 설계에 참고한 연구
          </span>
          <ArrowUpRight size={17} />
        </a>
        <a
          href="https://nlp.stanford.edu/IR-book/html/htmledition/okapi-bm25-a-non-binary-model-1.html"
          target="_blank"
          rel="noreferrer"
        >
          <Code2 size={17} />
          <span>
            <strong>Okapi BM25</strong>키워드 검색 점수의 계산 원리
          </span>
          <ArrowRight size={17} />
        </a>
      </div>
    </div>
  );
}
