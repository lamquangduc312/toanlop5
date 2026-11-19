import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AccountPanel from './components/AccountPanel';
import ExamList from './components/ExamList';
import ExamRunner from './components/ExamRunner';
import Header, { type Tab } from './components/Header';
import Leaderboard from './components/Leaderboard';
import ResultView from './components/ResultView';
import StatsDashboard from './components/StatsDashboard';
import TopicList from './components/TopicList';
import TopicPractice from './components/TopicPractice';
import { LearnerContext, useAccount, type LearnerInfo } from './lib/account';
import { saveProgress } from './lib/children';
import { buildExamSession, buildRandomExamSession, buildReviewSession, buildTopicSession } from './lib/session';
import { computeStars } from './lib/stars';
import { computeStats } from './lib/stats';
import { countGuestAttempts, importGuestAttempts, loadAttempts, saveAttempt, type DataSource, type Owner } from './lib/storage';
import type { Attempt, QuizSession, SaveState, TopicId } from './types';

type Screen =
  | { kind: 'home' }
  | { kind: 'quiz'; session: QuizSession; runId: number }
  | { kind: 'result'; session: QuizSession; attempt: Attempt; starsGained: number };

export default function App() {
  const account = useAccount();
  const { user, child, ready, replaceChild } = account;
  const [tab, setTab] = useState<Tab>('topics');
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>('guest');
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
  const [panelOpen, setPanelOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importHidden, setImportHidden] = useState(false);

  const owner: Owner | null = useMemo(
    () => (user && child ? { uid: user.uid, childId: child.id, nickname: child.nickname } : null),
    [user, child],
  );

  const attemptsRef = useRef<Attempt[]>([]);
  attemptsRef.current = attempts;
  const childRef = useRef(child);
  childRef.current = child;

  /** Ghi sao lên hồ sơ bé (cho bảng xếp hạng) – chỉ khi dữ liệu đọc từ Firebase đầy đủ */
  const syncStars = useCallback(
    async (list: Attempt[]) => {
      const c = childRef.current;
      if (!c) return;
      try {
        const updated = await saveProgress(c, computeStars(list));
        if (updated) replaceChild(updated);
      } catch (err) {
        console.error('[saveProgress]', err);
      }
    },
    [replaceChild],
  );

  const refresh = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      const { attempts: list, source } = await loadAttempts(owner);
      setAttempts(list);
      setDataSource(source);
      setGuestCount(owner ? countGuestAttempts() : 0);
      if (source === 'firebase') void syncStars(list);
    } finally {
      setLoading(false);
    }
  }, [owner, ready, syncStars]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Vừa đăng nhập mà chưa có hồ sơ bé → mở bảng tạo hồ sơ
  useEffect(() => {
    if (ready && user && account.children.length === 0) setPanelOpen(true);
  }, [ready, user, account.children.length]);

  const stats = useMemo(() => computeStats(attempts), [attempts]);
  const stars = useMemo(() => computeStars(attempts), [attempts]);

  const learner: LearnerInfo = useMemo(
    () => ({
      name: child?.nickname ?? 'bạn',
      loggedIn: Boolean(user),
      child,
      stars,
      openAccount: () => setPanelOpen(true),
    }),
    [child, user, stars],
  );

  const start = (session: QuizSession) => {
    if (session.questions.length === 0) return;
    setScreen({ kind: 'quiz', session, runId: Date.now() });
    window.scrollTo({ top: 0 });
  };

  const startTopic = (topicId: TopicId) => start(buildTopicSession(topicId, stats.needReviewIds));
  const startReview = () => start(buildReviewSession(stats.needReviewIds));

  const goHome = (nextTab?: Tab) => {
    if (nextTab) setTab(nextTab);
    setScreen({ kind: 'home' });
    window.scrollTo({ top: 0 });
  };

  const handleFinish = useCallback(
    async (session: QuizSession, attempt: Attempt) => {
      const before = attemptsRef.current;
      const next = [attempt, ...before];
      const starsGained = computeStars(next).total - computeStars(before).total;
      setScreen({ kind: 'result', session, attempt, starsGained });
      window.scrollTo({ top: 0 });
      setSaveState({ status: 'saving' });
      const res = await saveAttempt(attempt, owner);
      const list = [{ ...attempt, id: res.id }, ...before];
      setAttempts(list);
      setSaveState({ status: 'saved', where: res.where, note: res.note });
      if (res.where === 'local') setDataSource('local');
      if (res.where === 'firebase') void syncStars(list);
    },
    [owner, syncStars],
  );

  const doImport = async () => {
    if (!owner) return;
    setImporting(true);
    try {
      await importGuestAttempts(owner);
      await refresh();
    } finally {
      setImporting(false);
    }
  };

  /** Làm lại: đề cố định giữ nguyên câu hỏi; chủ đề / đề ngẫu nhiên tạo bộ câu mới */
  const retry = (session: QuizSession) => {
    if (session.mode === 'topic') return startTopic(session.refId as TopicId);
    if (session.mode === 'review') return startReview();
    if (session.refId === 'random') return start(buildRandomExamSession());
    start(buildExamSession(session.refId));
  };

  return (
    <LearnerContext.Provider value={learner}>
      <div className="min-h-screen">
        <Header tab={tab} onTab={(t) => goHome(t)} showNav={screen.kind === 'home'} dataSource={dataSource} />

        <main className="mx-auto max-w-5xl px-4 py-6">
          {screen.kind === 'home' && owner && guestCount > 0 && !importHidden && (
            <div className="card mb-6 flex flex-wrap items-center gap-3 border-2 border-amber-200 bg-amber-50 p-4">
              <span className="text-3xl" aria-hidden>
                📦
              </span>
              <p className="min-w-0 flex-1 text-slate-700">
                Máy này còn <b>{guestCount} bài</b> làm lúc chưa đăng nhập. Chuyển vào hồ sơ <b>{owner.nickname}</b> để được tính sao?
              </p>
              <button onClick={doImport} disabled={importing} className="btn btn-orange text-base">
                {importing ? 'Đang chuyển…' : 'Chuyển vào hồ sơ'}
              </button>
              <button onClick={() => setImportHidden(true)} className="btn btn-white text-base">
                Để sau
              </button>
            </div>
          )}

          {screen.kind === 'home' && tab === 'topics' && <TopicList stats={stats} onStart={startTopic} onReview={startReview} />}
          {screen.kind === 'home' && tab === 'exams' && (
            <ExamList stats={stats} onStart={(id) => start(buildExamSession(id))} onStartRandom={() => start(buildRandomExamSession())} />
          )}
          {screen.kind === 'home' && tab === 'stats' && (
            <StatsDashboard stats={stats} attempts={attempts} loading={loading} onRefresh={refresh} onPracticeTopic={startTopic} onReview={startReview} />
          )}
          {screen.kind === 'home' && tab === 'rank' && <Leaderboard />}

          {screen.kind === 'quiz' &&
            (screen.session.mode === 'exam' ? (
              <ExamRunner
                key={screen.runId}
                session={screen.session}
                onFinish={(a) => handleFinish(screen.session, a)}
                onExit={() => goHome('exams')}
              />
            ) : (
              <TopicPractice
                key={screen.runId}
                session={screen.session}
                onFinish={(a) => handleFinish(screen.session, a)}
                onExit={() => goHome()}
              />
            ))}

          {screen.kind === 'result' && (
            <ResultView
              attempt={screen.attempt}
              saveState={saveState}
              starsGained={screen.starsGained}
              onRetry={() => retry(screen.session)}
              onHome={() => goHome(screen.session.mode === 'exam' ? 'exams' : 'topics')}
              onPracticeTopic={startTopic}
            />
          )}
        </main>

        <footer className="pb-8 text-center text-sm text-slate-400">
          📚 Câu hỏi tổng hợp từ 21 đề kiểm tra giữa kì I – Toán 5 · Chúc các bạn học thật vui và thi thật tốt! 💖
        </footer>

        {panelOpen && <AccountPanel account={account} onClose={() => setPanelOpen(false)} />}
      </div>
    </LearnerContext.Provider>
  );
}
