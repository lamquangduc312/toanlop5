import { ArrowRight, CheckCheck, ChevronLeft, Flag } from 'lucide-react';
import { useRef, useState } from 'react';
import { buildAttempt, isCorrect } from '../lib/grading';
import type { Attempt, QuizSession } from '../types';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';

interface Props {
  session: QuizSession;
  onFinish: (attempt: Attempt) => void;
  onExit: () => void;
}

/** Chế độ luyện chủ đề / ôn câu sai: làm từng câu, chấm ngay, xem hướng dẫn giải rồi sang câu tiếp */
export default function TopicPractice({ session, onFinish, onExit }: Props) {
  const startedAt = useRef(Date.now());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const q = session.questions[index];
  const value = answers[q.id] ?? '';
  const isChecked = Boolean(checked[q.id]);
  const isLast = index === session.questions.length - 1;
  const correctSoFar = session.questions.filter((x) => checked[x.id] && isCorrect(x, answers[x.id])).length;
  const checkedCount = Object.keys(checked).length;

  const finish = (finalChecked = checked) => {
    // Chỉ chấm các câu đã làm (bé có thể dừng giữa chừng)
    const done = { ...session, questions: session.questions.filter((x) => finalChecked[x.id]) };
    if (done.questions.length === 0) return onExit();
    onFinish(buildAttempt(done, answers, Math.round((Date.now() - startedAt.current) / 1000)));
  };

  const check = () => {
    if (!value.trim()) return;
    setChecked((c) => ({ ...c, [q.id]: true }));
  };

  const next = () => {
    if (isLast) finish();
    else setIndex((i) => i + 1);
  };

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => (checkedCount ? finish() : onExit())} className="inline-flex items-center gap-1 font-bold text-slate-500 hover:text-slate-800">
          <ChevronLeft className="h-5 w-5" /> {checkedCount ? 'Dừng & xem kết quả' : 'Quay lại'}
        </button>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
          Đúng {correctSoFar}/{checkedCount}
        </span>
      </div>

      <div>
        <h1 className="text-xl font-extrabold text-slate-800">{session.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
          <ProgressBar value={(index + (isChecked ? 1 : 0)) / session.questions.length} />
          <span className="shrink-0 font-bold">
            {index + 1}/{session.questions.length}
          </span>
        </div>
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        index={index}
        value={value}
        onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
        locked={isChecked}
        showFeedback={isChecked}
        onEnter={isChecked ? next : check}
        autoFocus
      />

      <div className="flex justify-end">
        {!isChecked ? (
          <button
            onClick={check}
            disabled={!value.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-6 py-3 text-lg font-extrabold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <CheckCheck className="h-5 w-5" /> Kiểm tra
          </button>
        ) : (
          <button
            onClick={next}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-lg font-extrabold text-white hover:bg-indigo-600"
          >
            {isLast ? (
              <>
                <Flag className="h-5 w-5" /> Xem kết quả
              </>
            ) : (
              <>
                Câu tiếp theo <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
