import { useState } from 'react';
import { ArrowUpRight, Download, Search } from 'lucide-react';
import { benchmarkCases, conversations, DATASET_VERSION, getConversation } from '../engine/dataset';
import { CATEGORY_INFO } from '../engine/types';
import type { Category } from '../engine/types';
import { CategoryBadge, EmptyState } from './Shared';
import { downloadJson } from '../export';

export default function Dataset({ onCase }: { onCase: (id: string) => void }) {
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [query, setQuery] = useState('');
  const filtered = benchmarkCases.filter(
    (test) =>
      (category === 'all' || test.category === category) &&
      `${test.query} ${getConversation(test.conversationId).name}`.includes(query.trim()),
  );
  return (
    <div className="view-enter">
      <div className="page-heading with-action">
        <div>
          <h1>
            기억의 재료들<span className="orange">.</span>
          </h1>
          <p className="page-description">
            8명의 가상 인물, 48개의 질문. 실험의 모든 조건을 열어 둡니다.
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={() =>
            downloadJson(
              { version: DATASET_VERSION, conversations, cases: benchmarkCases },
              'recall-dataset.json',
            )
          }
        >
          <Download size={15} />
          데이터 내보내기
        </button>
      </div>
      <div className="dataset-banner">
        <div>
          <h2>작지만, 숨김없는 데이터셋.</h2>
          <p>
            직접 구성한 한국어 합성 대화입니다. 8개 대화에서 6개 유형의 질문을 파생했으며,
            <br className="desktop-only" />
            실제 사용자의 기억 성능이나 일반화 성능을 대표하지 않습니다.
          </p>
        </div>
        <div className="dataset-totals">
          <span>
            <strong>96</strong>기억
          </span>
          <span>
            <strong>48</strong>질문
          </span>
          <span>
            <strong>6</strong>유형
          </span>
        </div>
      </div>
      <div className="dataset-toolbar">
        <div className="filter-tabs" role="group" aria-label="평가 유형 필터">
          <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>
            전체 <span>48</span>
          </button>
          {(Object.keys(CATEGORY_INFO) as Category[]).map((cat) => (
            <button
              className={category === cat ? 'active' : ''}
              key={cat}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_INFO[cat].name}
            </button>
          ))}
        </div>
        <label className="search-input">
          <Search size={15} />
          <input
            aria-label="데이터셋 검색"
            placeholder="질문 또는 이름 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <section className="panel dataset-table-panel">
        <div className="dataset-count" role="status">
          {filtered.length}개의 질문 <span>{DATASET_VERSION}</span>
        </div>
        {filtered.length ? (
          <div className="table-scroll">
            <table className="dataset-table">
              <thead>
                <tr>
                  <th>대화</th>
                  <th>질문</th>
                  <th>평가 유형</th>
                  <th>정답 근거</th>
                  <th>
                    <span className="sr-only">실험하기</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((test) => {
                  const person = getConversation(test.conversationId);
                  return (
                    <tr key={test.id}>
                      <td>
                        <span className="table-person">
                          <span className="avatar mini" style={{ background: person.color }}>
                            {person.initials}
                          </span>
                          {person.name}
                        </span>
                      </td>
                      <td>
                        <button className="case-link" onClick={() => onCase(test.id)}>
                          {test.query}
                        </button>
                        <small>
                          {test.id}
                          {test.asOf ? ' · 10.06 UTC 기준' : ''}
                        </small>
                      </td>
                      <td>
                        <CategoryBadge category={test.category} />
                      </td>
                      <td>
                        <span className="evidence-count">{test.evidenceIds.length}개</span>
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`${test.id} 실험하기`}
                          onClick={() => onCase(test.id)}
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="일치하는 질문이 없어요"
            description="검색어를 바꾸거나 전체 유형을 선택해 주세요."
          />
        )}
      </section>
    </div>
  );
}
