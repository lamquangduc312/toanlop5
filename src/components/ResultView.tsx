import { Cloud, CloudOff, Home, Loader2, RotateCcw, Target, Trophy } from 'lucide-react';
import { useState } from 'react';
import { QUESTION_MAP, TOPICS } from '../mockData';
import { formatDuration, formatScore } from '../lib/grading';
import type { Attempt, SaveState, TopicId } from '../types';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import TopicIcon from './TopicIcon';

interface Props {
  attempt: Attempt;
  saveState: SaveState;
  onRetry: () => void;
  onHome: () => void;
  onPracticeTopic: (topicId: TopicId) => void;
}

function cheer(score: number) {
  if (score >= 9) return { text: 'Xuất sắc! Hà Ngân làm rất tốt!', cls: 'from-emerald-400 to-teal-500' };
  if (score >= 7) return { text: 'Khá lắm! Ôn thêm chút nữa là điểm 9, 10 thôi!', cls: 'from-sky-400 to-indigo-500' };
  if (score >= 5) return { text: 'Cố lên! Xem lại hướng dẫn giải các câu sai nhé.', cls: 'from-amber-400 to-orange-500' };
  return { text: 'Không sao cả! Mình ôn lại từng chủ đề rồi làm lại nhé.', cls: 'from-pink-400 to-rose-500' };
}

export default function ResultView({ attempt, saveState, onRetry, onHome, onPracticeTopic }: Props) {
  const [filter, setFilter] = useState<'all' | 'wrong'>('wrong');
  const c = cheer(attempt.score10);
  const results = filter === 'wrong' ? attempt.results.filter((r) => !r.correct) : attempt.results;

  const topicRows = (Object.entries(attempt.perTopic) as [TopicId, { correct: number; total: number }][])
    .map(([topicId, s]) => ({ topicId, ...s, acc: s.correct / s.total }))
    .sort((a, b) => a.acc - b.acc);

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <div className={`rounded-3xl bg-gradient-to-br ${c.cls} p-6 text-white shadow-lg`}>
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide opacity-90">
          <Trophy className="h-4 w-4" /> {attempt.title}
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="text-6xl font-extrabold">
            {formatScore(attempt.score10)}
            <span className="text-2xl opacity-80">/10</span>
          </p>
          <div className="pb-2 text-sm font-semibold opacity-95">
            <p>
              Đúng {attempt.correctCount}/{attempt.total} câu · {formatScore(attempt.earned)}/{formatScore(attempt.maxPoints)} điểm
            </p>
            <p>
              Thời gian: {formatDuration(attempt.durationSec)}
              {attempt.timeLimitSec ? ` / ${formatDuration(attempt.timeLimitSec)}` : ''}
              {attempt.timedOut ? ' · Hết giờ, tự nộp bài' : ''}
            </p>
          </div>
        </div>
        <p className="mt-3 text-lg font-bold">{c.text}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          {saveState.status === 'saving' && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang lưu kết quả…
            </>
          )}
          {saveState.status === 'saved' && saveState.where === 'firebase' && (
            <>
              <Cloud className="h-3.5 w-3.5" /> Đã lưu lên Firebase
            </>
          )}
          {saveState.status === 'saved' && saveState.where === 'local' && (
            <>
              <CloudOff className="h-3.5 w-3.5" /> {saveState.note ?? 'Đã lưu trên trình duyệt này'}
            </>
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-extrabold text-slate-800">
          <Target className="h-5 w-5 text-pink-500" /> Kết quả theo chủ đề
        </h2>
        <div className="space-y-3">
          {topicRows.map((row) => {
            const topic = TOPICS.find((t) => t.id === row.topicId)!;
            return (
              <div key={row.topicId} className="flex items-center gap-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${topic.accent}`}>
                  <TopicIcon topicId={row.topicId} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate font-semibold text-slate-700">{topic.name}</span>
                    <span className="shrink-0 font-bold text-slate-500">
                      {row.correct}/{row.total}
                    </span>
                  </div>
                  <ProgressBar value={row.acc} colorClass={row.acc < 0.6 ? 'bg-red-500' : row.acc < 0.85 ? 'bg-amber-400' : 'bg-emerald-500'} />
                </div>
                {row.acc < 0.85 && (
                  <button onClick={() => onPracticeTopic(row.topicId)} className="shrink-0 rounded-lg bg-pink-50 px-2.5 py-1 text-xs font-bold text-pink-600 hover:bg-pink-100">
                    Ôn ngay
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 font-bold text-white hover:bg-indigo-600">
          <RotateCcw className="h-4 w-4" /> Làm lại
        </button>
        <button onClick={onHome} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          <Home className="h-4 w-4" /> Về trang chính
        </button>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-800">Xem lại bài làm & hướng dẫn giải</h2>
          <div className="flex rounded-lg bg-slate-100 p-1 text-sm font-bold">
            {(['wrong', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1 ${filter === f ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}
              >
                {f === 'wrong' ? `Câu sai (${attempt.total - attempt.correctCount})` : 'Tất cả'}
              </button>
            ))}
          </div>
        </div>
        {results.length === 0 ? (
          <p className="rounded-2xl bg-emerald-50 p-6 text-center font-bold text-emerald-700">Không có câu nào sai. Tuyệt vời! 🎉</p>
        ) : (
          <div className="space-y-3">
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
