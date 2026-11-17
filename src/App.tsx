import { useCallback, useEffect, useMemo, useState } from 'react';
import ExamList from './components/ExamList';
import ExamRunner from './components/ExamRunner';
import Header, { type Tab } from './components/Header';
import ResultView from './components/ResultView';
import StatsDashboard from './components/StatsDashboard';
import TopicList from './components/TopicList';
import TopicPractice from './components/TopicPractice';
import { STUDENT } from './mockData';
import { isFirebaseConfigured } from './lib/firebase';
import { buildExamSession, buildRandomExamSession, buildReviewSession, buildTopicSession } from './lib/session';
import { computeStats } from './lib/stats';
import { loadAttempts, saveAttempt } from './lib/storage';
import type { Attempt, QuizSession, SaveState, TopicId } from './types';

type Screen =
  | { kind: 'home' }
  | { kind: 'quiz'; session: QuizSession; runId: number }
  | { kind: 'result'; session: QuizSession; attempt: Attempt };

export default function App() {
  const [tab, setTab] = useState<Tab>('topics');
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [dataSource, setDataSource] = useState<'firebase' | 'local'>(isFirebaseConfigured ? 'firebase' : 'local');
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { attempts: list, source } = await loadAttempts(STUDENT.id);
      setAttempts(list);
      setDataSource(source);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const stats = useMemo(() => computeStats(attempts), [attempts]);

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

  const handleFinish = useCallback(async (session: QuizSession, attempt: Attempt) => {
    setScreen({ kind: 'result', session, attempt });
    window.scrollTo({ top: 0 });
    setSaveState({ status: 'saving' });
    const res = await saveAttempt(attempt);
    setAttempts((prev) => [{ ...attempt, id: res.id }, ...prev]);
    setSaveState({ status: 'saved', where: res.where, note: res.note });
    if (res.where === 'local' && isFirebaseConfigured) setDataSource('local');
  }, []);

  /** Làm lại: đề cố định giữ nguyên câu hỏi; chủ đề / đề ngẫu nhiên tạo bộ câu mới */
  const retry = (session: QuizSession) => {
    if (session.mode === 'topic') return startTopic(session.refId as TopicId);
    if (session.mode === 'review') return startReview();
    if (session.refId === 'random') return start(buildRandomExamSession());
    start(buildExamSession(session.refId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-sky-50">
      <Header tab={tab} onTab={(t) => goHome(t)} showNav={screen.kind === 'home'} dataSource={dataSource} />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {screen.kind === 'home' && tab === 'topics' && <TopicList stats={stats} onStart={startTopic} onReview={startReview} />}
        {screen.kind === 'home' && tab === 'exams' && (
          <ExamList stats={stats} onStart={(id) => start(buildExamSession(id))} onStartRandom={() => start(buildRandomExamSession())} />
        )}
        {screen.kind === 'home' && tab === 'stats' && (
          <StatsDashboard stats={stats} attempts={attempts} loading={loading} onRefresh={refresh} onPracticeTopic={startTopic} onReview={startReview} />
        )}

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
            onRetry={() => retry(screen.session)}
            onHome={() => goHome(screen.session.mode === 'exam' ? 'exams' : 'topics')}
            onPracticeTopic={startTopic}
          />
        )}
      </main>

      <footer className="pb-8 text-center text-xs text-slate-400">
        Ngân hàng câu hỏi tổng hợp từ 21 đề kiểm tra giữa kì I – Toán 5 · Chúc Hà Ngân thi thật tốt!
      </footer>
    </div>
  );
}
