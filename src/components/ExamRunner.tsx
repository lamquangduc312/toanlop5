import { AlertTriangle, ChevronLeft, ChevronRight, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { buildAttempt } from '../lib/grading';
import type { Attempt, QuizSession } from '../types';
import QuestionCard from './QuestionCard';
import Timer from './Timer';

interface Props {
  session: QuizSession;
  onFinish: (attempt: Attempt) => void;
  onExit: () => void;
}

/** Chế độ làm cả đề: đếm ngược, làm tự do theo thứ tự bất kì, chỉ chấm khi nộp bài / hết giờ */
export default function ExamRunner({ session, onFinish, onExit }: Props) {
  const totalSec = session.timeLimitSec ?? 40 * 60;
  const startedAt = useRef(Date.now());
  const deadline = useRef(startedAt.current + totalSec * 1000);
  const submitted = useRef(false);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(totalSec);
  const [confirm, setConfirm] = useState<null | 'submit' | 'exit'>(null);

  const submit = useCallback(
    (timedOut: boolean) => {
      if (submitted.current) return;
      submitted.current = true;
      const duration = Math.min(totalSec, Math.round((Date.now() - startedAt.current) / 1000));
      onFinish(buildAttempt(session, answersRef.current, duration, timedOut));
    },
    [onFinish, session, totalSec],
  );

  // Tính thời gian còn lại theo mốc deadline (không bị lệch khi tab chạy nền)
  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) submit(true);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [submit]);

  // Cảnh báo khi lỡ tải lại / đóng tab giữa giờ thi
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!submitted.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const q = session.questions[index];
  const answeredCount = session.questions.filter((x) => (answers[x.id] ?? '').trim() !== '').length;
  const unanswered = session.questions.length - answeredCount;

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div className="sticky top-[72px] z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <button onClick={() => setConfirm('exit')} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Thoát">
          <X className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold text-slate-800">{session.title}</p>
          <p className="text-xs text-slate-500">
            Đã làm {answeredCount}/{session.questions.length} câu
          </p>
        </div>
        <Timer remainingSec={remaining} totalSec={totalSec} />
        <button
          onClick={() => setConfirm('submit')}
          className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500 px-4 py-2 font-bold text-white hover:bg-pink-600"
        >
          <Send className="h-4 w-4" /> Nộp bài
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {session.questions.map((x, i) => {
          const done = (answers[x.id] ?? '').trim() !== '';
          return (
            <button
              key={x.id}
              onClick={() => setIndex(i)}
              className={`h-9 w-9 rounded-lg text-sm font-extrabold transition ${
                i === index ? 'bg-slate-800 text-white' : done ? 'bg-pink-100 text-pink-700' : 'bg-white text-slate-500 ring-1 ring-slate-200'
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        index={index}
        value={answers[q.id] ?? ''}
        onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
        onEnter={() => setIndex((i) => Math.min(i + 1, session.questions.length - 1))}
        autoFocus
      />

      <div className="flex justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 font-bold text-slate-700 ring-1 ring-slate-200 disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" /> Câu trước
        </button>
        <button
          onClick={() => setIndex((i) => Math.min(session.questions.length - 1, i + 1))}
          disabled={index === session.questions.length - 1}
          className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 font-bold text-slate-700 ring-1 ring-slate-200 disabled:opacity-40"
        >
          Câu sau <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="flex items-center gap-2 text-lg font-extrabold text-slate-800">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {confirm === 'submit' ? 'Nộp bài?' : 'Thoát bài thi?'}
            </p>
            <p className="mt-2 text-slate-600">
              {confirm === 'submit'
                ? unanswered > 0
                  ? `Em còn ${unanswered} câu chưa làm. Em đã dò lại đơn vị và dấu phẩy chưa?`
                  : 'Em đã làm hết các câu. Dò lại đơn vị và dấu phẩy rồi nộp nhé!'
                : 'Bài làm sẽ không được chấm và không được lưu.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100">
                Làm tiếp
              </button>
              <button
                onClick={() => {
                  if (confirm === 'submit') submit(false);
                  else {
                    submitted.current = true;
                    onExit();
                  }
                }}
                className={`rounded-xl px-4 py-2 font-bold text-white ${confirm === 'submit' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-slate-700 hover:bg-slate-800'}`}
              >
                {confirm === 'submit' ? 'Nộp bài' : 'Thoát'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
