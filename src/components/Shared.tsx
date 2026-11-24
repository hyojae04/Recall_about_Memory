import { ArrowUpRight, Check, CircleHelp, FlaskConical, Layers3, Sparkles } from 'lucide-react';
import type { Category, Strategy } from '../engine/types';
import { CATEGORY_INFO, STRATEGY_INFO } from '../engine/types';

export const percent = (number: number) => `${(number * 100).toFixed(1).replace('.0', '')}%`;
export const dateLabel = (timestamp: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(new Date(timestamp));

export function Logo() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M10 25V12a6.5 6.5 0 0 1 13 0v5a3.5 3.5 0 0 1-7 0v-6M16 24v4"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
export function StrategyIcon({ strategy, size = 18 }: { strategy: Strategy; size?: number }) {
  return strategy === 'recent' ? (
    <Layers3 size={size} />
  ) : strategy === 'bm25' ? (
    <FlaskConical size={size} />
  ) : (
    <Sparkles size={size} />
  );
}
export function StrategyBadge({ strategy }: { strategy: Strategy }) {
  return (
    <span className={`strategy-label ${strategy}`}>
      <span style={{ background: STRATEGY_INFO[strategy].color }} />
      {STRATEGY_INFO[strategy].name}
    </span>
  );
}
export function CategoryBadge({ category }: { category: Category }) {
  return <span className={`category-badge ${category}`}>{CATEGORY_INFO[category].name}</span>;
}
export function StatusDot({ success }: { success: boolean }) {
  return (
    <span
      className={`status-dot ${success ? 'pass' : 'fail'}`}
      role="img"
      aria-label={success ? '통과' : '실패'}
    >
      {success ? <Check size={12} strokeWidth={2.5} /> : <span />}
    </span>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <CircleHelp size={24} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
      </div>
      {action && (
        <button className="text-button" onClick={onAction}>
          {action}
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}
