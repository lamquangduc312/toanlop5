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

const LETTER_STYLES = [
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-700',
];

const PRAISES = ['🎉 Chính xác! Giỏi quá!', '🌟 Đúng rồi! Tuyệt vời!', '👏 Hay lắm!', '🚀 Quá đỉnh! Làm tiếp nào!', '💯 Chuẩn luôn!'];

/** Chọn lời khen cố định theo câu hỏi để không đổi khi giao diện vẽ lại */
function praiseFor(id: string) {
  const sum = [...id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return PRAISES[sum % PRAISES.length];
}

export default function QuestionCard({ question: q, index, value, onChange, locked, showFeedback, onEnter, autoFocus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const topic = TOPICS.find((t) => t.id === q.topicId);
  const correct = showFeedback ? isCorrect(q, value) : null;

  useEffect(() => {
    if (autoFocus && q.type === 'input' && !locked) inputRef.current?.focus();
  }, [autoFocus, q.id, q.type, locked]);

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-xl bg-slate-800 px-3 py-1 font-display text-base font-bold text-white">Câu {index + 1}</span>
        {topic && (
          <span className={`chip ${topic.accent}`}>
            {topic.emoji} {topic.name}
          </span>
        )}
        <span className="chip bg-amber-50 text-amber-700">⭐ {questionPoints(q).toLocaleString('vi-VN')} điểm</span>
      </div>

      <p className="whitespace-pre-line text-xl font-medium leading-relaxed text-slate-800">{q.prompt}</p>

      {q.type === 'mc' ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            const selected = value === String(i);
            let cls = 'border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50';
            if (selected) cls = 'border-pink-400 bg-pink-50 ring-4 ring-pink-100';
            if (showFeedback && i === q.answer) cls = 'border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100';
            else if (showFeedback && selected) cls = 'border-red-300 bg-red-50 ring-4 ring-red-100';
            return (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => onChange?.(String(i))}
                className={`flex items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3.5 text-left text-lg font-medium text-slate-700 transition active:translate-y-0.5 disabled:cursor-default disabled:active:translate-y-0 ${cls}`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-lg font-extrabold ${LETTER_STYLES[i % LETTER_STYLES.length]}`}>
                  {OPTION_LETTERS[i]}
                </span>
                <span>{opt}</span>
                {showFeedback && i === q.answer && <span className="ml-auto text-xl">✅</span>}
                {showFeedback && selected && i !== q.answer && <span className="ml-auto text-xl">❌</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex items-center gap-3">
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
              className={`w-full max-w-xs rounded-2xl border-2 border-b-4 bg-white px-4 py-3 font-display text-2xl font-bold text-slate-800 outline-none transition placeholder:font-sans placeholder:text-lg placeholder:font-normal placeholder:text-slate-300 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 disabled:bg-slate-50 ${
                showFeedback ? (correct ? 'border-emerald-400' : 'border-red-300') : 'border-slate-200'
              }`}
            />
            {q.unit && <span className="font-display text-xl font-bold text-slate-600">{q.unit}</span>}
          </div>
          {!locked && <p className="mt-2 text-sm text-slate-400">✍️ Số thập phân dùng dấu phẩy, ví dụ 0,75. Phân số viết dạng 3/4.</p>}
        </div>
      )}

      {showFeedback && (
        <div className={`mt-5 rounded-2xl border-2 p-4 animate-pop ${correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <p className={`font-display text-2xl font-extrabold ${correct ? 'text-emerald-600' : 'text-red-600'}`}>
            {correct ? praiseFor(q.id) : '🤔 Chưa đúng rồi, xem cách giải nhé!'}
          </p>
          {!correct && (
            <p className="mt-1 text-slate-700">
              Em trả lời: <b>{userAnswerText(q, value)}</b> · Đáp án đúng: <b className="text-emerald-700">{correctAnswerText(q)}</b>
            </p>
          )}
          <div className="mt-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-3.5 text-slate-700">
            <p className="mb-1 font-display text-lg font-bold text-amber-700">💡 Hướng dẫn giải</p>
            <p className="whitespace-pre-line leading-relaxed">{q.explanation}</p>
            <p className="mt-2 text-xs text-slate-400">Nguồn: {q.source}</p>
          </div>
        </div>
      )}
    </div>
  );
}
