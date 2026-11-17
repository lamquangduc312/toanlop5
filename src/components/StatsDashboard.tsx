import { AlertTriangle, BarChart3, Flame, History, Loader2, RefreshCw, RotateCcw, Star, Timer } from 'lucide-react';
import { TOPICS } from '../mockData';
import { formatDuration, formatScore } from '../lib/grading';
import type { Attempt, Stats, TopicId } from '../types';
import ProgressBar from './ProgressBar';
import { LEVEL_BADGE } from './TopicList';
import TopicIcon from './TopicIcon';

interface Props {
  stats: Stats;
  attempts: Attempt[];
  loading: boolean;
  onRefresh: () => void;
  onPracticeTopic: (topicId: TopicId) => void;
  onReview: () => void;
}

const MODE_LABEL: Record<Attempt['mode'], string> = { topic: 'Chủ đề', exam: 'Đề 40 phút', review: 'Ôn câu sai' };

function StatCard({ icon: Icon, label, value, cls }: { icon: typeof Star; label: string; value: string; cls: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${cls}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-2 text-2xl font-extrabold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function StatsDashboard({ stats, attempts, loading, onRefresh, onPracticeTopic, onReview }: Props) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Thống kê học tập</h1>
          <p className="text-slate-500">Tỉ lệ đúng tính trên 30 câu gần nhất của mỗi chủ đề, nên khi bé tiến bộ thì con số sẽ tăng theo.</p>
        </div>
        <button onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Tải lại
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Flame} label="Tổng lượt làm bài" value={String(stats.totalAttempts)} cls="bg-orange-100 text-orange-600" />
        <StatCard icon={Timer} label="Số đề 40 phút đã làm" value={String(stats.examAttempts)} cls="bg-indigo-100 text-indigo-600" />
        <StatCard icon={BarChart3} label="Điểm TB các đề" value={stats.avgExamScore != null ? formatScore(stats.avgExamScore) : '–'} cls="bg-sky-100 text-sky-600" />
        <StatCard icon={Star} label="Điểm đề cao nhất" value={stats.bestExamScore != null ? formatScore(stats.bestExamScore) : '–'} cls="bg-amber-100 text-amber-600" />
      </div>

      {(stats.weakTopics.length > 0 || stats.needReviewIds.length > 0) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="flex items-center gap-2 font-extrabold text-red-700">
            <AlertTriangle className="h-5 w-5" /> Gợi ý ôn tập lại
          </h2>
          <ul className="mt-3 space-y-2">
            {stats.weakTopics.map((s) => {
              const topic = TOPICS.find((t) => t.id === s.topicId)!;
              return (
                <li key={s.topicId} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3">
                  <TopicIcon topicId={s.topicId} className="h-4 w-4 text-slate-500" />
                  <span className="flex-1 font-semibold text-slate-700">{topic.name}</span>
                  <span className="text-sm font-bold text-red-600">Đúng {Math.round((s.accuracy ?? 0) * 100)}%</span>
                  <button onClick={() => onPracticeTopic(s.topicId)} className="rounded-lg bg-pink-500 px-3 py-1 text-sm font-bold text-white hover:bg-pink-600">
                    Ôn ngay
                  </button>
                </li>
              );
            })}
          </ul>
          {stats.needReviewIds.length > 0 && (
            <button onClick={onReview} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600">
              <RotateCcw className="h-4 w-4" /> Làm lại {stats.needReviewIds.length} câu lần gần nhất còn sai
            </button>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-extrabold text-slate-800">Mức độ thành thạo theo chủ đề</h2>
        <div className="space-y-4">
          {stats.topicStats.map((s) => {
            const topic = TOPICS.find((t) => t.id === s.topicId)!;
            const badge = LEVEL_BADGE[s.level];
            return (
              <div key={s.topicId} className="flex items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${topic.accent}`}>
                  <TopicIcon topicId={s.topicId} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 text-sm">
                    <span className="font-semibold text-slate-700">{topic.name}</span>
                    <span className="text-slate-500">
                      {s.accuracy != null ? `${s.correct}/${s.total} câu · ${Math.round(s.accuracy * 100)}% · ${s.attemptCount} lượt` : 'Chưa luyện'}
                    </span>
                  </div>
                  <ProgressBar value={s.accuracy ?? 0} colorClass={topic.bar} />
                </div>
                <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-bold sm:inline ${badge.cls}`}>{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-extrabold text-slate-800">
          <History className="h-5 w-5 text-slate-500" /> Lịch sử làm bài
        </h2>
        {attempts.length === 0 ? (
          <p className="py-6 text-center text-slate-500">Chưa có lượt làm bài nào. Bắt đầu với một chủ đề nhé!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2 pr-3">Thời điểm</th>
                  <th className="py-2 pr-3">Bài</th>
                  <th className="py-2 pr-3">Loại</th>
                  <th className="py-2 pr-3 text-right">Đúng</th>
                  <th className="py-2 pr-3 text-right">Điểm</th>
                  <th className="py-2 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.slice(0, 50).map((a) => (
                  <tr key={a.id ?? a.createdAt}>
                    <td className="whitespace-nowrap py-2 pr-3 text-slate-500">{new Date(a.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="py-2 pr-3 font-semibold text-slate-700">{a.title}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-slate-500">{MODE_LABEL[a.mode]}</td>
                    <td className="py-2 pr-3 text-right text-slate-600">
                      {a.correctCount}/{a.total}
                    </td>
                    <td className={`py-2 pr-3 text-right font-extrabold ${a.score10 >= 8 ? 'text-emerald-600' : a.score10 >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                      {formatScore(a.score10)}
                    </td>
                    <td className="py-2 text-right text-slate-500">{formatDuration(a.durationSec)}</td>
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
