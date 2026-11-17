import { Lightbulb, Play, RotateCcw } from 'lucide-react';
import { TOPICS } from '../mockData';
import { questionsOfTopic } from '../lib/session';
import type { Stats, TopicId, TopicLevel } from '../types';
import ProgressBar from './ProgressBar';
import TopicIcon from './TopicIcon';

interface Props {
  stats: Stats;
  onStart: (topicId: TopicId) => void;
  onReview: () => void;
}

export const LEVEL_BADGE: Record<TopicLevel, { label: string; cls: string }> = {
  none: { label: 'Chưa luyện', cls: 'bg-slate-100 text-slate-500' },
  weak: { label: 'Cần ôn gấp', cls: 'bg-red-100 text-red-700' },
  ok: { label: 'Khá – ôn thêm', cls: 'bg-amber-100 text-amber-700' },
  good: { label: 'Tốt', cls: 'bg-emerald-100 text-emerald-700' },
};

export default function TopicList({ stats, onStart, onReview }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Học theo từng chủ đề</h1>
          <p className="text-slate-500">Mỗi lượt 10 câu, chấm ngay từng câu kèm hướng dẫn giải. Câu làm sai lần trước sẽ được hỏi lại trước.</p>
        </div>
        {stats.needReviewIds.length > 0 && (
          <button onClick={onReview} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600">
            <RotateCcw className="h-4 w-4" /> Ôn lại {stats.needReviewIds.length} câu còn sai
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TOPICS.map((topic, i) => {
          const st = stats.topicStats.find((s) => s.topicId === topic.id);
          const badge = LEVEL_BADGE[st?.level ?? 'none'];
          return (
            <article key={topic.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${topic.accent}`}>
                  <TopicIcon topicId={topic.id} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Chủ đề {i + 1}</p>
                  <h2 className="font-extrabold text-slate-800">{topic.name}</h2>
                  <p className="text-sm text-slate-500">{topic.description}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${badge.cls}`}>{badge.label}</span>
              </div>

              <ul className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {topic.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{questionsOfTopic(topic.id).length} câu trong ngân hàng</span>
                    <span>
                      {st?.accuracy != null ? `Đúng ${Math.round(st.accuracy * 100)}% · ${st.attemptCount} lượt` : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                  <ProgressBar value={st?.accuracy ?? 0} colorClass={topic.bar} />
                </div>
                <button
                  onClick={() => onStart(topic.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500 px-4 py-2 font-bold text-white hover:bg-pink-600"
                >
                  <Play className="h-4 w-4" /> Luyện
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
