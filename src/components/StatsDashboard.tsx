import { Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { TOPICS } from '../mockData';
import { formatDuration, formatScore } from '../lib/grading';
import type { Attempt, Stats, TopicId } from '../types';
import ProgressBar from './ProgressBar';
import { LEVEL_BADGE } from './TopicList';

interface Props {
  stats: Stats;
  attempts: Attempt[];
  loading: boolean;
  onRefresh: () => void;
  onPracticeTopic: (topicId: TopicId) => void;
  onReview: () => void;
}

const MODE_LABEL: Record<Attempt['mode'], string> = { topic: '📚 Chủ đề', exam: '⏱️ Đề 40 phút', review: '🔁 Ôn câu sai' };

function StatCard({ emoji, label, value, cls }: { emoji: string; label: string; value: string; cls: string }) {
  return (
    <div className={`rounded-3xl border-2 p-4 ${cls}`}>
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <p className="mt-1 font-display text-4xl font-extrabold leading-none text-slate-800">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </div>
  );
}

export default function StatsDashboard({ stats, attempts, loading, onRefresh, onPracticeTopic, onReview }: Props) {
  return (
    <section className="space-y-6">
      <div className="card relative overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100 p-6">
        <span className="pointer-events-none absolute -right-1 -top-2 text-7xl animate-floaty sm:text-8xl" aria-hidden>
          📈
        </span>
        <h1 className="pr-20 text-3xl font-extrabold text-slate-800 sm:text-4xl">Hà Ngân tiến bộ thế nào?</h1>
        <p className="mt-1 max-w-xl pr-16 text-slate-600">Tỉ lệ đúng tính trên 30 câu gần nhất của mỗi chủ đề, nên khi em tiến bộ thì con số sẽ tăng theo.</p>
        <button onClick={onRefresh} disabled={loading} className="btn btn-white mt-3 px-3 py-1.5 text-base">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Tải lại
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard emoji="🔥" label="Lượt làm bài" value={String(stats.totalAttempts)} cls="border-orange-200 bg-orange-50" />
        <StatCard emoji="📝" label="Đề 40 phút đã làm" value={String(stats.examAttempts)} cls="border-indigo-200 bg-indigo-50" />
        <StatCard emoji="📊" label="Điểm TB các đề" value={stats.avgExamScore != null ? formatScore(stats.avgExamScore) : '–'} cls="border-sky-200 bg-sky-50" />
        <StatCard emoji="🏆" label="Điểm đề cao nhất" value={stats.bestExamScore != null ? formatScore(stats.bestExamScore) : '–'} cls="border-amber-200 bg-amber-50" />
      </div>

      {(stats.weakTopics.length > 0 || stats.needReviewIds.length > 0) && (
        <div className="rounded-3xl border-2 border-rose-200 bg-rose-50 p-5">
          <h2 className="text-2xl font-bold text-rose-700">🎯 Mình cần ôn lại</h2>
          <ul className="mt-3 space-y-2">
            {stats.weakTopics.map((s) => {
              const topic = TOPICS.find((t) => t.id === s.topicId)!;
              return (
                <li key={s.topicId} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3">
                  <span className="text-2xl" aria-hidden>
                    {topic.emoji}
                  </span>
                  <span className="flex-1 font-medium text-slate-700">{topic.name}</span>
                  <span className="font-display text-lg font-bold text-rose-600">Đúng {Math.round((s.accuracy ?? 0) * 100)}%</span>
                  <button onClick={() => onPracticeTopic(s.topicId)} className={`btn px-3 py-1.5 text-sm ${topic.btn}`}>
                    Ôn ngay
                  </button>
                </li>
              );
            })}
          </ul>
          {stats.needReviewIds.length > 0 && (
            <button onClick={onReview} className="btn btn-orange mt-3">
              <RotateCcw className="h-5 w-5" /> Làm lại {stats.needReviewIds.length} câu còn sai
            </button>
          )}
        </div>
      )}

      <div className="card p-5">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">🧭 Mức độ thành thạo theo chủ đề</h2>
        <div className="space-y-4">
          {stats.topicStats.map((s) => {
            const topic = TOPICS.find((t) => t.id === s.topicId)!;
            const badge = LEVEL_BADGE[s.level];
            return (
              <div key={s.topicId} className="flex items-center gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl ${topic.accent}`} aria-hidden>
                  {topic.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 text-sm">
                    <span className="font-medium text-slate-700">{topic.name}</span>
                    <span className="text-slate-500">
                      {s.accuracy != null ? `${s.correct}/${s.total} câu · ${Math.round(s.accuracy * 100)}% · ${s.attemptCount} lượt` : 'Chưa luyện'}
                    </span>
                  </div>
                  <ProgressBar value={s.accuracy ?? 0} colorClass={topic.bar} />
                </div>
                <span className={`chip hidden shrink-0 sm:inline-flex ${badge.cls}`}>{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-2xl font-bold text-slate-800">📅 Lịch sử làm bài</h2>
        {attempts.length === 0 ? (
          <p className="py-6 text-center text-slate-500">Chưa có lượt làm bài nào. Bắt đầu với một chủ đề nhé! 🚀</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="font-display text-sm text-slate-400">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Thời điểm</th>
                  <th className="py-2 pr-3 font-semibold">Bài</th>
                  <th className="py-2 pr-3 font-semibold">Loại</th>
                  <th className="py-2 pr-3 text-right font-semibold">Đúng</th>
                  <th className="py-2 pr-3 text-right font-semibold">Điểm</th>
                  <th className="py-2 text-right font-semibold">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-orange-50">
                {attempts.slice(0, 50).map((a) => (
                  <tr key={a.id ?? a.createdAt}>
                    <td className="whitespace-nowrap py-2.5 pr-3 text-slate-500">{new Date(a.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="py-2.5 pr-3 font-medium text-slate-700">{a.title}</td>
                    <td className="whitespace-nowrap py-2.5 pr-3 text-slate-500">{MODE_LABEL[a.mode]}</td>
                    <td className="py-2.5 pr-3 text-right text-slate-600">
                      {a.correctCount}/{a.total}
                    </td>
                    <td
                      className={`py-2.5 pr-3 text-right font-display text-lg font-extrabold ${a.score10 >= 8 ? 'text-emerald-600' : a.score10 >= 5 ? 'text-amber-600' : 'text-rose-600'}`}
                    >
                      {formatScore(a.score10)}
                    </td>
                    <td className="py-2.5 text-right text-slate-500">{formatDuration(a.durationSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
