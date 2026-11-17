import { ChevronLeft, ChevronRight, Send, X } from 'lucide-react';
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
      <div className="card sticky top-[84px] z-10 flex flex-wrap items-center gap-3 p-3">
        <button onClick={() => setConfirm('exit')} className="btn btn-white p-2" title="Thoát" aria-label="Thoát bài thi">
          <X className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-bold leading-tight text-slate-800">{session.title}</p>
          <p className="text-sm text-slate-500">
            ✏️ Đã làm <b className="text-pink-600">{answeredCount}</b>/{session.questions.length} câu
          </p>
        </div>
        <Timer remainingSec={remaining} totalSec={totalSec} />
        <button onClick={() => setConfirm('submit')} className="btn btn-pink">
          <Send className="h-5 w-5" /> Nộp bài
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {session.questions.map((x, i) => {
          const done = (answers[x.id] ?? '').trim() !== '';
          return (
            <button
              key={x.id}
              onClick={() => setIndex(i)}
              aria-label={`Câu ${i + 1}${done ? ' – đã làm' : ''}`}
              className={`h-11 w-11 rounded-xl border-2 border-b-4 font-display text-lg font-bold transition active:translate-y-0.5 ${
                i === index
                  ? 'border-indigo-700 bg-indigo-500 text-white'
                  : done
                    ? 'border-pink-300 bg-pink-100 text-pink-700'
                    : 'border-slate-200 bg-white text-slate-500'
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
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="btn btn-white">
          <ChevronLeft className="h-5 w-5" /> Câu trước
        </button>
        <button
          onClick={() => setIndex((i) => Math.min(session.questions.length - 1, i + 1))}
          disabled={index === session.questions.length - 1}
          className="btn btn-indigo"
        >
          Câu sau <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-900/40 p-4">
          <div className="card w-full max-w-sm p-6 text-center animate-pop">
            <p className="text-5xl" aria-hidden>
              {confirm === 'submit' ? (unanswered > 0 ? '🧐' : '📮') : '🚪'}
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold text-slate-800">{confirm === 'submit' ? 'Nộp bài nhé?' : 'Thoát bài thi?'}</p>
            <p className="mt-2 text-slate-600">
              {confirm === 'submit'
                ? unanswered > 0
                  ? `Em còn ${unanswered} câu chưa làm. Em đã dò lại đơn vị và dấu phẩy chưa?`
                  : 'Em đã làm hết các câu. Dò lại đơn vị và dấu phẩy rồi nộp nhé!'
                : 'Bài làm sẽ không được chấm và không được lưu.'}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button onClick={() => setConfirm(null)} className="btn btn-white">
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
                className={`btn ${confirm === 'submit' ? 'btn-pink' : 'border-slate-900 bg-slate-700 text-white hover:bg-slate-600'}`}
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
