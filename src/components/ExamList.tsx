import { Play } from 'lucide-react';
import { EXAM_DURATION_MIN, EXAMS } from '../mockData';
import { formatScore } from '../lib/grading';
import type { Exam, Stats } from '../types';

interface Props {
  stats: Stats;
  onStart: (examId: string) => void;
  onStartRandom: () => void;
}

const PALETTE = [
  { soft: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', btn: 'bg-sky-500 border-sky-700 text-white hover:bg-sky-400' },
  { soft: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', btn: 'bg-violet-500 border-violet-700 text-white hover:bg-violet-400' },
  { soft: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', btn: 'bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-400' },
  { soft: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', btn: 'bg-rose-500 border-rose-700 text-white hover:bg-rose-400' },
  { soft: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', btn: 'bg-amber-400 border-amber-600 text-amber-950 hover:bg-amber-300' },
  { soft: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', btn: 'bg-teal-500 border-teal-700 text-white hover:bg-teal-400' },
];

function stars(score: number) {
  return score >= 9 ? 3 : score >= 7 ? 2 : score >= 5 ? 1 : 0;
}

function ExamCard({ exam, index, summary, onStart }: { exam: Exam; index: number; summary?: { best: number; count: number }; onStart: () => void }) {
  const c = PALETTE[index % PALETTE.length];
  const isSchool = !exam.source.includes('KNTT');
  return (
    <article className={`flex flex-col rounded-3xl border-2 p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${c.soft} ${c.border}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-b-4 bg-white text-2xl ${c.border}`} aria-hidden>
          {isSchool ? '🏫' : '📝'}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug text-slate-800">{exam.title}</h3>
          <p className={`text-xs font-semibold ${c.text}`}>{exam.source}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip bg-white text-slate-600">⏰ {exam.durationMin} phút</span>
        <span className="chip bg-white text-slate-600">✏️ {exam.questionIds.length} câu</span>
      </div>
      <div className="mt-3 flex min-h-[28px] items-center gap-2 text-sm">
        {summary ? (
          <>
            <span className="text-lg tracking-tight" aria-label={`${stars(summary.best)} sao`}>
              {'⭐'.repeat(stars(summary.best))}
              <span className="opacity-25">{'⭐'.repeat(3 - stars(summary.best))}</span>
            </span>
            <span className="font-semibold text-slate-600">
              Cao nhất {formatScore(summary.best)} · {summary.count} lần
            </span>
          </>
        ) : (
          <span className="text-slate-400">Chưa làm lần nào</span>
        )}
      </div>
      <button onClick={onStart} className={`btn mt-3 ${c.btn}`}>
        <Play className="h-4 w-4 fill-current" /> {summary ? 'Làm lại' : 'Bắt đầu'}
      </button>
    </article>
  );
}

export default function ExamList({ stats, onStart, onStartRandom }: Props) {
  const bookExams = EXAMS.filter((e) => e.source.includes('KNTT'));
  const schoolExams = EXAMS.filter((e) => !e.source.includes('KNTT'));

  return (
    <section className="space-y-6">
      <div className="card relative overflow-hidden bg-gradient-to-br from-indigo-100 via-sky-50 to-emerald-100 p-6">
        <span className="pointer-events-none absolute right-4 top-4 text-6xl leading-none animate-floaty sm:right-6 sm:top-5 sm:text-7xl" aria-hidden>
          ⏰
        </span>
        <h1 className="pr-20 text-3xl font-extrabold text-slate-800 sm:text-4xl">Làm cả đề – {EXAM_DURATION_MIN} phút</h1>
        <p className="mt-1 max-w-xl pr-16 text-slate-600">Như thi thật nhé! Đồng hồ đếm ngược, hết giờ tự nộp bài, điểm chấm theo thang 10.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="chip bg-white px-3 py-1 text-sm text-indigo-600">🧘 Đọc kĩ đề</span>
          <span className="chip bg-white px-3 py-1 text-sm text-indigo-600">🔁 Đổi cùng đơn vị</span>
          <span className="chip bg-white px-3 py-1 text-sm text-indigo-600">🔍 Dò lại dấu phẩy</span>
        </div>
      </div>

      <button
        onClick={onStartRandom}
        className="flex w-full items-center gap-4 rounded-3xl border-b-[6px] border-pink-700 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 p-5 text-left text-white shadow-lg transition hover:brightness-105 active:translate-y-1 active:border-b-2"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/25 text-4xl" aria-hidden>
          🎲
        </span>
        <div className="flex-1">
          <p className="font-display text-2xl font-extrabold leading-tight">Đề ngẫu nhiên tổng hợp</p>
          <p className="text-sm text-white/90">16 câu – mỗi chủ đề 2 câu. Mỗi lần bấm là một đề mới!</p>
        </div>
        <Play className="h-8 w-8 shrink-0 fill-current" />
      </button>

      <div>
        <h2 className="mb-3 text-2xl font-bold text-slate-800">📘 Đề luyện theo sách Kết nối tri thức</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookExams.map((exam, i) => (
            <ExamCard key={exam.id} exam={exam} index={i} summary={stats.examSummary[exam.id]} onStart={() => onStart(exam.id)} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-2xl font-bold text-slate-800">🏫 Đề thi thật của các trường</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schoolExams.map((exam, i) => (
            <ExamCard key={exam.id} exam={exam} index={i + 3} summary={stats.examSummary[exam.id]} onStart={() => onStart(exam.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}
