import { ChevronDown, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { TOPICS } from '../mockData';
import { questionsOfTopic } from '../lib/session';
import type { Stats, Topic, TopicId, TopicLevel, TopicStat } from '../types';
import { useLearner } from '../lib/account';
import ProgressBar from './ProgressBar';

interface Props {
  stats: Stats;
  onStart: (topicId: TopicId) => void;
  onReview: () => void;
}

export const LEVEL_BADGE: Record<TopicLevel, { label: string; cls: string }> = {
  none: { label: '🌱 Chưa luyện', cls: 'bg-white text-slate-500 ring-1 ring-slate-200' },
  weak: { label: '💪 Cần ôn thêm', cls: 'bg-red-100 text-red-700' },
  ok: { label: '🙂 Khá rồi', cls: 'bg-amber-100 text-amber-800' },
  good: { label: '🌟 Giỏi lắm', cls: 'bg-emerald-100 text-emerald-700' },
};

function TopicCard({ topic, index, stat, onStart }: { topic: Topic; index: number; stat?: TopicStat; onStart: () => void }) {
  const [showTips, setShowTips] = useState(false);
  const badge = LEVEL_BADGE[stat?.level ?? 'none'];
  const [firstTip, ...moreTips] = topic.tips;

  return (
    <article className={`flex flex-col rounded-3xl border-2 p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${topic.soft} ${topic.border}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-2 border-b-4 bg-white text-4xl ${topic.border}`} aria-hidden>
          {topic.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-display text-sm font-bold uppercase tracking-wider ${topic.text}`}>Chủ đề {index + 1}</p>
          <h2 className="text-xl font-bold leading-snug text-slate-800">{topic.name}</h2>
        </div>
        <span className={`chip shrink-0 ${badge.cls}`}>{badge.label}</span>
      </div>

      <p className="mt-2 text-sm text-slate-600">{topic.description}</p>

      <div className="mt-3 rounded-2xl bg-white/80 p-3 text-sm text-slate-700">
        <p className="flex gap-2">
          <span aria-hidden>💡</span>
          <span>{firstTip}</span>
        </p>
        {showTips &&
          moreTips.map((tip) => (
            <p key={tip} className="mt-2 flex gap-2 animate-pop">
              <span aria-hidden>💡</span>
              <span>{tip}</span>
            </p>
          ))}
        {moreTips.length > 0 && (
          <button onClick={() => setShowTips((s) => !s)} className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${topic.text}`}>
            {showTips ? 'Thu gọn' : `Xem thêm ${moreTips.length} mẹo`}
            <ChevronDown className={`h-3.5 w-3.5 transition ${showTips ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <div className="mt-auto flex items-end gap-3 pt-4">
        <div className="flex-1">
          <div className="mb-1.5 flex justify-between text-xs text-slate-500">
            <span>{questionsOfTopic(topic.id).length} câu hỏi</span>
            <span className="font-semibold">
              {stat?.accuracy != null ? `Đúng ${Math.round(stat.accuracy * 100)}% · ${stat.attemptCount} lượt` : 'Chưa có dữ liệu'}
            </span>
          </div>
          <ProgressBar value={stat?.accuracy ?? 0} colorClass={topic.bar} />
        </div>
        <button onClick={onStart} className={`btn ${topic.btn}`}>
          <Play className="h-4 w-4 fill-current" /> Luyện
        </button>
      </div>
    </article>
  );
}

export default function TopicList({ stats, onStart, onReview }: Props) {
  const goodCount = stats.topicStats.filter((s) => s.level === 'good').length;
  const { name, child, stars, loggedIn, openAccount } = useLearner();

  return (
    <section className="space-y-6">
      <div className="card relative overflow-hidden bg-gradient-to-br from-amber-100 via-pink-50 to-sky-100 p-6">
        <span className="pointer-events-none absolute right-4 top-4 text-6xl leading-none opacity-90 animate-floaty sm:right-6 sm:top-5 sm:text-7xl" aria-hidden>
          {child?.avatar ?? '🐼'}
        </span>
        <h1 className="pr-20 text-3xl font-extrabold text-slate-800 sm:text-4xl">Chào {name}! 👋</h1>
        <p className="mt-1 max-w-xl pr-16 text-slate-600">
          Hôm nay mình luyện chủ đề nào nhỉ? Mỗi lượt 10 câu, làm câu nào chấm câu đó, có hướng dẫn giải ngay.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {loggedIn && child ? (
            <>
              <span className="chip bg-white px-3 py-1 text-sm text-amber-600">⭐ {stars.total} sao</span>
              {stars.streak > 0 && <span className="chip bg-white px-3 py-1 text-sm text-orange-600">🔥 {stars.streak} ngày liên tiếp</span>}
            </>
          ) : (
            <button onClick={openAccount} className="chip bg-amber-400 px-3 py-1 text-sm text-white hover:bg-amber-500">
              ⭐ Đăng nhập để tích sao & xếp hạng
            </button>
          )}
          <span className="chip bg-white px-3 py-1 text-sm text-orange-600">📝 {stats.totalAttempts} lượt đã làm</span>
          <span className="chip bg-white px-3 py-1 text-sm text-emerald-600">
            🌟 {goodCount}/{TOPICS.length} chủ đề giỏi
          </span>
          {stats.needReviewIds.length > 0 && (
            <button onClick={onReview} className="btn btn-orange ml-auto text-base">
              <RotateCcw className="h-4 w-4" /> Ôn lại {stats.needReviewIds.length} câu còn sai
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {TOPICS.map((topic, i) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            index={i}
            stat={stats.topicStats.find((s) => s.topicId === topic.id)}
            onStart={() => onStart(topic.id)}
          />
        ))}
      </div>
    </section>
  );
}
