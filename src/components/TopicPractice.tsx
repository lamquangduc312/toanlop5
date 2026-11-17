import { ArrowRight, CheckCheck, ChevronLeft, Flag } from 'lucide-react';
import { useRef, useState } from 'react';
import { TOPICS } from '../mockData';
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
  const topic = session.mode === 'topic' ? TOPICS.find((t) => t.id === session.refId) : undefined;

  const finish = () => {
    // Chỉ chấm các câu đã làm (bé có thể dừng giữa chừng)
    const done = { ...session, questions: session.questions.filter((x) => checked[x.id]) };
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
        <button onClick={() => (checkedCount ? finish() : onExit())} className="btn btn-white px-3 py-2 text-base">
          <ChevronLeft className="h-5 w-5" /> {checkedCount ? 'Dừng & xem kết quả' : 'Quay lại'}
        </button>
        <span className="chip bg-white px-3 py-1.5 font-display text-base font-bold text-emerald-600 ring-2 ring-emerald-100">
          ⭐ Đúng {correctSoFar}/{checkedCount}
        </span>
      </div>

      <div className="card p-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <span aria-hidden>{topic?.emoji ?? '🔁'}</span>
          {topic?.name ?? session.title}
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <ProgressBar
            value={(index + (isChecked ? 1 : 0)) / session.questions.length}
            colorClass={topic?.bar ?? 'bg-gradient-to-r from-pink-400 to-orange-400'}
            className="h-4"
          />
          <span className="shrink-0 font-display text-lg font-bold text-slate-600">
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
          <button onClick={check} disabled={!value.trim()} className="btn btn-pink px-8 py-3 text-xl">
            <CheckCheck className="h-6 w-6" /> Kiểm tra
          </button>
        ) : (
          <button onClick={next} className="btn btn-indigo px-8 py-3 text-xl">
            {isLast ? (
              <>
                <Flag className="h-6 w-6" /> Xem kết quả
              </>
            ) : (
              <>
                Câu tiếp theo <ArrowRight className="h-6 w-6" />
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
