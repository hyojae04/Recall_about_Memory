import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Database,
  FlaskConical,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Monitor,
  Play,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import Overview from './components/Overview';
import Playground from './components/Playground';
import Dataset from './components/Dataset';
import Methods from './components/Methods';
import { dateLabel, Logo } from './components/Shared';
import { runBenchmark } from './engine/evaluation';
import { getConversation } from './engine/dataset';
import type { BenchmarkRun } from './engine/types';
import { downloadJson } from './export';

type Page = 'overview' | 'playground' | 'dataset' | 'methods';
const pages = [
  { id: 'overview' as const, name: '실험 개요', icon: LayoutDashboard },
  { id: 'playground' as const, name: '플레이그라운드', icon: FlaskConical },
  { id: 'dataset' as const, name: '데이터셋', icon: Database },
  { id: 'methods' as const, name: '평가 방법', icon: BookOpen },
];
function route() {
  const [page, caseId] = window.location.hash.slice(1).split('/');
  return {
    page: (pages.some((p) => p.id === page) ? page : 'overview') as Page,
    caseId: caseId || 'mina-update',
  };
}

export default function App() {
  const [location, setLocation] = useState(route);
  const [k, setK] = useState(3);
  const [run, setRun] = useState(() => runBenchmark(3));
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [memoryView, setMemoryView] = useState<{
    conversationId: string;
    memoryId?: string;
  } | null>(null);
  const worker = useRef<Worker | null>(null);
  const main = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const active = pages.find((page) => page.id === location.page)!;

  useEffect(() => {
    const update = () => {
      setLocation(route());
      setMenuOpen(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('hashchange', update);
      worker.current?.terminate();
    };
  }, []);
  useEffect(() => {
    document.title = `${active.name} · Recall`;
  }, [active.name]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(''), 4500);
    return () => clearTimeout(timer);
  }, [notification]);
  useEffect(() => {
    if (memoryView) {
      dialog.current?.showModal();
      if (memoryView.memoryId)
        requestAnimationFrame(() =>
          document
            .getElementById(`source-${memoryView.memoryId}`)
            ?.scrollIntoView({ block: 'center' }),
        );
    } else dialog.current?.close();
  }, [memoryView]);

  function go(page: Page, caseId?: string) {
    window.location.hash = `${page}${caseId ? `/${caseId}` : ''}`;
    setMenuOpen(false);
  }
  function executeBenchmark() {
    worker.current?.terminate();
    setRunning(true);
    setError('');
    setProgress(0);
    try {
      const current = new Worker(new URL('./engine/benchmark.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.current = current;
      current.onmessage = (
        event: MessageEvent<{
          type: string;
          completed?: number;
          total?: number;
          run?: BenchmarkRun;
          message?: string;
        }>,
      ) => {
        if (event.data.type === 'progress') setProgress(event.data.completed! / event.data.total!);
        else if (event.data.type === 'complete') {
          setRun(event.data.run!);
          setRunning(false);
          setNotification(`48개 질문 × 3개 전략의 실험을 완료했습니다. K = ${event.data.run!.k}`);
          current.terminate();
        } else {
          setError('실험을 완료하지 못했습니다. 다시 실행해 주세요.');
          setRunning(false);
          current.terminate();
        }
      };
      current.onerror = () => {
        setError('실험 엔진을 불러오지 못했습니다. 새로고침 후 다시 실행해 주세요.');
        setRunning(false);
        current.terminate();
      };
      current.postMessage({ k });
    } catch {
      setError(
        '이 브라우저에서 실험 엔진을 시작하지 못했습니다. 최신 브라우저로 다시 시도해 주세요.',
      );
      setRunning(false);
    }
  }

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        본문으로 건너뛰기
      </a>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="메뉴 닫기"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <a className="brand" href="#overview" aria-label="Recall 실험 개요">
          <Logo />
          <span>
            recall<span className="orange">.</span>
            <small>MEMORY LAB</small>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-monogram">R</span>
          <div>
            Personal workspace<small>로컬 실험실</small>
          </div>
          <span className="workspace-dot" />
        </div>
        <nav aria-label="주 메뉴">
          <span className="nav-label">워크스페이스</span>
          {pages.map(({ id, name, icon: Icon }) => (
            <a
              href={`#${id}`}
              key={id}
              className={`nav-item ${location.page === id ? 'active' : ''}`}
              aria-current={location.page === id ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{name}</span>
              {id === 'dataset' ? (
                <span className="nav-count">48</span>
              ) : location.page === id ? (
                <span className="nav-active-dot" />
              ) : null}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <span className="local-symbol">
              <Monitor size={19} />
            </span>
            <h3>작은 실험, 분명한 근거.</h3>
            <p>
              질문부터 원문까지,
              <br />
              기억을 확인하는 실험실.
            </p>
            <button onClick={() => go('methods')}>
              실험 이해하기 <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="engine-status">
            <span className="small-dot green" />
            <span>로컬 엔진 준비됨</span>
            <small>v1.0</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-expanded={menuOpen}
              aria-label="메뉴 열기"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={19} />
            </button>
            <span className="breadcrumb-home">Workspace</span>
            <ChevronRight size={13} />
            <strong>{active.name}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-badge">
              <span className="small-dot green" />
              Local-first
            </span>
            <span className="topbar-divider" />
            <span className="profile-avatar" role="img" aria-label="로컬 워크스페이스">
              R
            </span>
          </div>
        </header>
        <main id="main-content" ref={main} tabIndex={-1}>
          <div className="experiment-toolbar">
            <div className="experiment-name">
              <span className="experiment-indicator" />
              <span>Korean memory benchmark</span>
              <span className="version-tag">v1.0</span>
            </div>
            <div className="experiment-actions">
              <label className="top-k-setting">
                Top K{' '}
                <select
                  aria-label="벤치마크 검색 결과 수"
                  value={k}
                  disabled={running}
                  onChange={(e) => setK(Number(e.target.value))}
                >
                  {[1, 3, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="icon-button export-button"
                onClick={() => {
                  downloadJson(run, `recall-results-k${run.k}.json`);
                  setNotification('실험 결과 JSON을 다운로드했습니다.');
                }}
                aria-label="실험 결과 내보내기"
                title="실험 결과 내보내기"
              >
                <ArrowDownToLine size={17} />
              </button>
              <button
                className="primary-button run-button"
                onClick={executeBenchmark}
                disabled={running}
              >
                {running ? (
                  <LoaderCircle className="spin" size={14} />
                ) : (
                  <Play size={13} fill="currentColor" />
                )}
                {running ? '실험 중' : '실험 실행'}
              </button>
            </div>
          </div>
          {k !== run.k && (
            <div className="settings-notice">
              <RotateCcw size={14} />
              설정은 K = {k}, 아래 벤치마크는 K = {run.k}의 결과입니다. 실험을 실행해 반영하세요.
            </div>
          )}
          {running && (
            <div
              className="run-progress"
              role="progressbar"
              aria-label="벤치마크 실행 진행률"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${progress * 100}%` }} />
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button onClick={executeBenchmark}>다시 실행</button>
            </div>
          )}
          {location.page === 'overview' && (
            <Overview
              run={run}
              onCase={(id) => go('playground', id)}
              onLab={() => go('playground')}
              onMethods={() => go('methods')}
            />
          )}
          {location.page === 'playground' && (
            <Playground
              key={location.caseId}
              initialCase={location.caseId}
              k={k}
              onK={setK}
              onMemory={(conversationId, memoryId) => setMemoryView({ conversationId, memoryId })}
            />
          )}
          {location.page === 'dataset' && <Dataset onCase={(id) => go('playground', id)} />}
          {location.page === 'methods' && <Methods run={run} />}
          <footer className="page-footer">
            <span>
              recall<span className="orange">.</span>
              <small>A little more context. A better memory.</small>
            </span>
            <span>Built to question. Made to verify.</span>
          </footer>
        </main>
      </div>
      <div className={`toast ${notification ? 'visible' : ''}`} role="status">
        {notification && (
          <>
            <span className="toast-icon">
              <Check size={15} />
            </span>
            {notification}
            <button aria-label="알림 닫기" onClick={() => setNotification('')}>
              <X size={14} />
            </button>
          </>
        )}
      </div>
      <dialog
        ref={dialog}
        className="memory-dialog"
        aria-labelledby="memory-title"
        onCancel={() => setMemoryView(null)}
        onClose={() => setMemoryView(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMemoryView(null);
        }}
      >
        {memoryView && (
          <div className="memory-dialog-content">
            <header>
              <div>
                <span className="quiet-chip">SOURCE CONTEXT</span>
                <h2 id="memory-title">
                  {getConversation(memoryView.conversationId).name}의 대화 원문
                </h2>
                <p>기억이 바뀐 순간을 대화 속에서 확인하세요.</p>
              </div>
              <button
                autoFocus
                className="icon-button"
                aria-label="대화 원문 닫기"
                onClick={() => setMemoryView(null)}
              >
                <X size={20} />
              </button>
            </header>
            <div className="memory-timeline">
              {getConversation(memoryView.conversationId).memories.map((memory, index, all) => (
                <article
                  id={`source-${memory.id}`}
                  className={`timeline-item ${memory.id === memoryView.memoryId ? 'highlighted' : ''}`}
                  key={memory.id}
                >
                  {index === 0 || all[index - 1].session !== memory.session ? (
                    <div className="timeline-session">대화 {memory.session}</div>
                  ) : null}
                  <div className="timeline-meta">
                    <span>{memory.id}</span>
                    <time>{dateLabel(memory.timestamp)}</time>
                  </div>
                  <p>{memory.text}</p>
                  {memory.supersedes && (
                    <span className="correction-link">
                      <ShieldCheck size={12} />
                      {memory.supersedes} 정정 · 수동 표시
                    </span>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
