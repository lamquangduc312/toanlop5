import { Clock, FileText, Play, Shuffle, Trophy } from 'lucide-react';
import { EXAM_DURATION_MIN, EXAMS } from '../mockData';
import { formatScore } from '../lib/grading';
import type { Stats } from '../types';

interface Props {
  stats: Stats;
  onStart: (examId: string) => void;
  onStartRandom: () => void;
}

export default function ExamList({ stats, onStart, onStartRandom }: Props) {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Làm cả đề – {EXAM_DURATION_MIN} phút</h1>
        <p className="text-slate-500">
          Đồng hồ đếm ngược như thi thật, hết giờ tự nộp bài. Điểm được quy về thang 10 và lưu lại để thống kê.
        </p>
      </div>

      <button
        onClick={onStartRandom}
        className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50 p-5 text-left hover:bg-pink-100"
      >
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-pink-500 text-white">
          <Shuffle className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <p className="font-extrabold text-slate-800">Đề ngẫu nhiên tổng hợp</p>
          <p className="text-sm text-slate-600">16 câu – mỗi chủ đề 2 câu, mỗi lần làm là một đề mới.</p>
        </div>
        <Play className="h-5 w-5 text-pink-500" />
      </button>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMS.map((exam) => {
          const summary = stats.examSummary[exam.id];
          return (
            <article key={exam.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
                <div>
                  <h2 className="font-extrabold leading-snug text-slate-800">{exam.title}</h2>
                  <p className="text-xs text-slate-500">{exam.source}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                  <Clock className="h-3.5 w-3.5" /> {exam.durationMin} phút
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{exam.questionIds.length} câu</span>
                {summary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                    <Trophy className="h-3.5 w-3.5" /> Cao nhất {formatScore(summary.best)} · {summary.count} lần
                  </span>
                )}
              </div>
              <button
                onClick={() => onStart(exam.id)}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 font-bold text-white hover:bg-indigo-600"
              >
                <Play className="h-4 w-4" /> {summary ? 'Làm lại' : 'Bắt đầu'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
