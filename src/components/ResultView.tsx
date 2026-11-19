import { CloudOff, Home, RotateCcw, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QUESTION_MAP, TOPICS } from '../mockData';
import { formatDuration, formatScore } from '../lib/grading';
import { useLearner } from '../lib/account';
import { playResultSound } from '../lib/sound';
import type { Attempt, SaveState, TopicId } from '../types';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';

interface Props {
  attempt: Attempt;
  saveState: SaveState;
  /** Số sao bài này mang lại */
  starsGained: number;
  onRetry: () => void;
  onHome: () => void;
  onPracticeTopic: (topicId: TopicId) => void;
}

function cheer(score: number, name: string) {
  if (score >= 9) return { emoji: '🏆', stars: 3, text: `Xuất sắc! ${name} làm rất tốt!`, cls: 'from-emerald-400 via-teal-400 to-sky-400' };
  if (score >= 7) return { emoji: '🌟', stars: 2, text: 'Khá lắm! Ôn thêm chút nữa là điểm 9, 10 thôi!', cls: 'from-sky-400 via-indigo-400 to-violet-400' };
  if (score >= 5) return { emoji: '💪', stars: 1, text: 'Cố lên! Xem lại hướng dẫn giải các câu sai nhé.', cls: 'from-amber-400 via-orange-400 to-pink-400' };
  return { emoji: '🌱', stars: 0, text: 'Không sao cả! Mình ôn lại từng chủ đề rồi làm lại nhé.', cls: 'from-pink-400 via-rose-400 to-orange-400' };
}

// Ghi nhớ bài đã phát âm thanh (tránh phát 2 lần khi React StrictMode chạy lại effect)
let playedFor: number | undefined;

export default function ResultView({ attempt, saveState, starsGained, onRetry, onHome, onPracticeTopic }: Props) {
  const { name, loggedIn, child, openAccount } = useLearner();
  const [filter, setFilter] = useState<'all' | 'wrong'>('wrong');
  const c = cheer(attempt.score10, name === 'bạn' ? 'Bạn' : name);

  // Phát âm thanh thông báo một lần cho mỗi bài làm
  useEffect(() => {
    if (playedFor === attempt.createdAt) return;
    playedFor = attempt.createdAt;
    playResultSound(attempt.score10);
  }, [attempt.createdAt, attempt.score10]);
  const results = filter === 'wrong' ? attempt.results.filter((r) => !r.correct) : attempt.results;

  const topicRows = (Object.entries(attempt.perTopic) as [TopicId, { correct: number; total: number }][])
    .map(([topicId, s]) => ({ topicId, ...s, acc: s.correct / s.total }))
    .sort((a, b) => a.acc - b.acc);

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${c.cls} p-6 text-white shadow-xl animate-pop`}>
        <span className="pointer-events-none absolute right-4 top-4 text-7xl leading-none animate-floaty sm:right-6 sm:top-5 sm:text-8xl" aria-hidden>
          {c.emoji}
        </span>
        <p className="pr-24 font-display text-lg font-bold uppercase tracking-wide opacity-95">{attempt.title}</p>
        <p className="mt-1 text-3xl tracking-tight" aria-label={`${c.stars} sao`}>
          {'⭐'.repeat(c.stars)}
          <span className="opacity-30">{'⭐'.repeat(3 - c.stars)}</span>
        </p>
        <div className="mt-1 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="font-display text-7xl font-extrabold leading-none">
            {formatScore(attempt.score10)}
            <span className="text-3xl opacity-80">/10</span>
          </p>
          <div className="pb-1 text-sm font-medium">
            <p>
              ✅ Đúng {attempt.correctCount}/{attempt.total} câu · {formatScore(attempt.earned)}/{formatScore(attempt.maxPoints)} điểm
            </p>
            <p>
              ⏱️ {formatDuration(attempt.durationSec)}
              {attempt.timeLimitSec ? ` / ${formatDuration(attempt.timeLimitSec)}` : ''}
              {attempt.timedOut ? ' · Hết giờ, tự nộp bài' : ''}
            </p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 font-display text-2xl font-bold">
          {c.text}
          <button
            onClick={() => playResultSound(attempt.score10)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/25 hover:bg-white/40"
            title="Nghe lại"
            aria-label="Nghe lại âm thanh"
          >
            <Volume2 className="h-5 w-5" />
          </button>
        </p>
        {starsGained > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="chip animate-wiggle bg-white px-3 py-1 font-display text-xl font-extrabold text-amber-500 shadow">+{starsGained} ⭐</span>
            {loggedIn && child ? (
              <span className="text-sm font-semibold">Đã cộng vào sao của {child.nickname}!</span>
            ) : (
              <button onClick={openAccount} className="btn btn-white px-3 py-1 text-sm text-amber-600">
                Đăng nhập để giữ sao & lên bảng xếp hạng
              </button>
            )}
          </div>
        )}
        {/* Chỉ báo khi KHÔNG lưu được online */}
        {saveState.status === 'saved' && saveState.where === 'local' && (
          <p className="chip mt-3 bg-white/25 px-3 py-1 text-white">
            <CloudOff className="h-3.5 w-3.5" /> {saveState.note ?? 'Đã lưu trên trình duyệt này'}
          </p>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-2xl font-bold text-slate-800">🎯 Kết quả theo chủ đề</h2>
        <div className="space-y-3">
          {topicRows.map((row) => {
            const topic = TOPICS.find((t) => t.id === row.topicId)!;
            return (
              <div key={row.topicId} className="flex items-center gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${topic.accent}`} aria-hidden>
                  {topic.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate font-medium text-slate-700">{topic.name}</span>
                    <span className="shrink-0 font-display text-base font-bold text-slate-600">
                      {row.correct}/{row.total}
                    </span>
                  </div>
                  <ProgressBar value={row.acc} colorClass={row.acc < 0.6 ? 'bg-red-400' : row.acc < 0.85 ? 'bg-amber-400' : 'bg-emerald-500'} />
                </div>
                {row.acc < 0.85 && (
                  <button onClick={() => onPracticeTopic(row.topicId)} className={`btn shrink-0 px-3 py-1.5 text-sm ${topic.btn}`}>
                    Ôn ngay
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onRetry} className="btn btn-indigo">
          <RotateCcw className="h-5 w-5" /> Làm lại
        </button>
        <button onClick={onHome} className="btn btn-white">
          <Home className="h-5 w-5" /> Về trang chính
        </button>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-bold text-slate-800">📒 Xem lại bài & cách giải</h2>
          <div className="flex gap-2">
            {(['wrong', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn px-3 py-1.5 text-sm ${filter === f ? 'border-pink-700 bg-pink-500 text-white' : 'btn-white'}`}
              >
                {f === 'wrong' ? `Câu sai (${attempt.total - attempt.correctCount})` : 'Tất cả'}
              </button>
            ))}
          </div>
        </div>
        {results.length === 0 ? (
          <p className="card p-8 text-center font-display text-2xl font-bold text-emerald-600">🎉 Không có câu nào sai. Tuyệt vời!</p>
        ) : (
          <div className="space-y-4">
            {results.map((r) => {
              const q = QUESTION_MAP[r.questionId];
              if (!q) return null;
              const idx = attempt.results.findIndex((x) => x.questionId === r.questionId);
              return <QuestionCard key={r.questionId} question={q} index={idx} value={r.userAnswer} locked showFeedback />;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
