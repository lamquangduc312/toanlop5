import type { Attempt, Question, QuestionResult, QuizSession, TopicId, TopicScore } from '../types';

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function questionPoints(q: Question): number {
  if (q.points != null) return q.points;
  if (q.topicId === 'loi-van') return 2;
  return q.type === 'mc' ? 0.5 : 1;
}

/**
 * Đọc số theo cách viết Việt Nam:
 *  - "0,75" / "1 130" / "16 850 000" / "1.234.567"
 *  - chấp nhận cả "0.75" (bé gõ nhầm dấu chấm làm dấu thập phân)
 */
export function parseVnNumber(raw: string): number | null {
  let s = raw.trim().replace(/\s+/g, '');
  if (!s) return null;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if ((s.match(/\./g) ?? []).length > 1) {
    s = s.replace(/\./g, '');
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

function normalizeText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s*([/;:])\s*/g, '$1')
    .replace(/\s+/g, ' ');
}

export function answersEqual(expected: string, given: string): boolean {
  const a = parseVnNumber(expected);
  const b = parseVnNumber(given);
  if (a !== null && b !== null) return Math.abs(a - b) < 1e-9;
  return normalizeText(expected) === normalizeText(given);
}

export function isCorrect(q: Question, value: string | undefined): boolean {
  if (value == null || value.trim() === '') return false;
  if (q.type === 'mc') return Number(value) === q.answer;
  return q.answers.some((ans) => answersEqual(ans, value));
}

export function correctAnswerText(q: Question): string {
  if (q.type === 'mc') return `${OPTION_LETTERS[q.answer]}. ${q.options[q.answer]}`;
  return q.unit ? `${q.answers[0]} ${q.unit}` : q.answers[0];
}

export function userAnswerText(q: Question, value: string | undefined): string {
  if (value == null || value.trim() === '') return '(bỏ trống)';
  if (q.type === 'mc') {
    const idx = Number(value);
    return `${OPTION_LETTERS[idx]}. ${q.options[idx]}`;
  }
  return q.unit ? `${value} ${q.unit}` : value;
}

export function buildAttempt(
  session: QuizSession,
  answers: Record<string, string>,
  durationSec: number,
  timedOut = false,
): Attempt {
  const results: QuestionResult[] = session.questions.map((q) => {
    const userAnswer = answers[q.id] ?? '';
    const correct = isCorrect(q, userAnswer);
    const points = questionPoints(q);
    return { questionId: q.id, topicId: q.topicId, userAnswer, correct, points, earned: correct ? points : 0 };
  });

  const perTopic: Partial<Record<TopicId, TopicScore>> = {};
  for (const r of results) {
    const t = (perTopic[r.topicId] ??= { correct: 0, total: 0 });
    t.total += 1;
    if (r.correct) t.correct += 1;
  }

  const earned = results.reduce((s, r) => s + r.earned, 0);
  const maxPoints = results.reduce((s, r) => s + r.points, 0);

  return {
    // App gắn mã bé + biệt danh khi lưu
    studentId: '',
    studentName: '',
    mode: session.mode,
    refId: session.refId,
    title: session.title,
    // Quy về thang điểm 10, làm tròn 1 chữ số thập phân
    score10: maxPoints > 0 ? Math.round((earned / maxPoints) * 100) / 10 : 0,
    earned,
    maxPoints,
    correctCount: results.filter((r) => r.correct).length,
    total: results.length,
    durationSec,
    timeLimitSec: session.timeLimitSec,
    timedOut,
    perTopic,
    wrongQuestionIds: results.filter((r) => !r.correct).map((r) => r.questionId),
    results,
    createdAt: Date.now(),
  };
}

export function formatScore(n: number): string {
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
