import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { TOPICS } from '../mockData';
import { OPTION_LETTERS, correctAnswerText, isCorrect, questionPoints, userAnswerText } from '../lib/grading';
import type { Question } from '../types';

interface Props {
  question: Question;
  index: number;
  value: string;
  onChange?: (value: string) => void;
  /** Khoá lựa chọn (sau khi chấm) */
  locked?: boolean;
  /** Hiện đúng/sai + hướng dẫn giải */
  showFeedback?: boolean;
  onEnter?: () => void;
  autoFocus?: boolean;
}

export default function QuestionCard({ question: q, index, value, onChange, locked, showFeedback, onEnter, autoFocus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const topic = TOPICS.find((t) => t.id === q.topicId);
  const correct = showFeedback ? isCorrect(q, value) : null;

  useEffect(() => {
    if (autoFocus && q.type === 'input' && !locked) inputRef.current?.focus();
  }, [autoFocus, q.id, q.type, locked]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-white">Câu {index + 1}</span>
        {topic && <span className={`rounded-full px-2.5 py-0.5 ${topic.accent}`}>{topic.name}</span>}
        <span className="text-slate-400">{questionPoints(q).toLocaleString('vi-VN')} điểm</span>
      </div>

      <p className="whitespace-pre-line text-lg font-semibold leading-relaxed text-slate-800">{q.prompt}</p>

      {q.type === 'mc' ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            const selected = value === String(i);
            let cls = 'border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50';
            if (selected) cls = 'border-pink-500 bg-pink-50 ring-2 ring-pink-200';
            if (showFeedback && i === q.answer) cls = 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200';
            else if (showFeedback && selected) cls = 'border-red-400 bg-red-50 ring-2 ring-red-200';
            return (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => onChange?.(String(i))}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left font-semibold text-slate-700 transition disabled:cursor-default ${cls}`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-extrabold">{OPTION_LETTERS[i]}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              disabled={locked}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEnter?.();
              }}
              placeholder="Nhập đáp án…"
              className={`w-full max-w-xs rounded-xl border-2 px-4 py-2.5 text-lg font-bold outline-none transition focus:border-pink-500 disabled:bg-slate-50 ${
                showFeedback ? (correct ? 'border-emerald-500' : 'border-red-400') : 'border-slate-200'
              }`}
            />
            {q.unit && <span className="font-bold text-slate-600">{q.unit}</span>}
          </div>
          {!locked && <p className="mt-1.5 text-xs text-slate-400">Số thập phân dùng dấu phẩy, ví dụ 0,75. Phân số viết dạng 3/4.</p>}
        </div>
      )}

      {showFeedback && (
        <div className={`mt-4 rounded-xl p-4 ${correct ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`flex items-center gap-2 font-extrabold ${correct ? 'text-emerald-700' : 'text-red-700'}`}>
            {correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {correct ? 'Chính xác! Giỏi lắm!' : 'Chưa đúng rồi'}
          </p>
          {!correct && (
            <p className="mt-1 text-sm text-slate-700">
              Em trả lời: <b>{userAnswerText(q, value)}</b> · Đáp án đúng: <b className="text-emerald-700">{correctAnswerText(q)}</b>
            </p>
          )}
          <div className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-slate-700">
            <p className="mb-1 flex items-center gap-1.5 font-bold text-amber-700">
              <Lightbulb className="h-4 w-4" /> Hướng dẫn giải
            </p>
            <p className="whitespace-pre-line">{q.explanation}</p>
            <p className="mt-2 text-xs text-slate-400">Nguồn: {q.source}</p>
          </div>
        </div>
      )}
    </div>
  );
}
