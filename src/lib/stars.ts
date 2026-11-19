import type { Attempt } from '../types';
import { computeStats } from './stats';

/**
 * Tính sao từ toàn bộ lịch sử bài làm (luôn tính lại từ đầu → cùng dữ liệu cho cùng kết quả,
 * bài cũ của Hà Ngân cũng được cộng sao). Thưởng cả sự chăm chỉ lẫn kết quả, có trần mỗi ngày để chống "cày".
 */

export const DAILY_CAP = 30;
const STREAK_BONUS: Record<number, number> = { 3: 3, 7: 7, 14: 15, 30: 30 };

export const STAR_RULES: { emoji: string; text: string; stars: string }[] = [
  { emoji: '📚', text: 'Luyện xong 1 lượt chủ đề hoặc ôn câu sai (làm từ 5 câu)', stars: '+1' },
  { emoji: '🎯', text: 'Lượt luyện đó đúng từ 80% trở lên', stars: '+1' },
  { emoji: '⏱️', text: 'Làm xong 1 đề 40 phút (làm từ một nửa số câu)', stars: '+1' },
  { emoji: '🏅', text: 'Đề đạt từ 7 điểm / 9 điểm / 10 điểm (cùng một đề: chỉ thưởng khi vượt mức cũ)', stars: '+1 / +2 / +3' },
  { emoji: '🧠', text: 'Làm đúng một câu trước đây từng sai (mỗi câu một lần)', stars: '+1' },
  { emoji: '☀️', text: 'Bài học đầu tiên trong ngày', stars: '+1' },
  { emoji: '🔥', text: 'Học liên tục 3 / 7 / 14 / 30 ngày', stars: '+3 / +7 / +15 / +30' },
];

export interface Badge {
  id: string;
  emoji: string;
  label: string;
  desc: string;
}

export const BADGES: Badge[] = [
  { id: 'first', emoji: '🌱', label: 'Khởi đầu', desc: 'Hoàn thành bài học đầu tiên' },
  { id: 'streak3', emoji: '🔥', label: 'Chăm chỉ', desc: 'Học 3 ngày liên tiếp' },
  { id: 'streak7', emoji: '🚀', label: 'Bền bỉ', desc: 'Học 7 ngày liên tiếp' },
  { id: 'fixer', emoji: '🧠', label: 'Sửa sai', desc: 'Làm đúng 20 câu từng sai' },
  { id: 'exams5', emoji: '📝', label: 'Chiến binh đề', desc: 'Làm 5 đề khác nhau' },
  { id: 'perfect', emoji: '💯', label: 'Điểm 10', desc: 'Đạt 10 điểm một đề' },
  { id: 'allTopics', emoji: '🎓', label: 'Nhà toán học nhí', desc: 'Đạt "Giỏi lắm" cả 8 chủ đề' },
  { id: 'stars100', emoji: '⭐', label: '100 sao', desc: 'Tích lũy 100 sao' },
];

export interface StarSummary {
  total: number;
  /** Sao theo tuần: khoá dạng w2026_47 (tuần bắt đầu thứ Hai) */
  weeks: Record<string, number>;
  today: number;
  /** Chuỗi ngày học liên tiếp còn hiệu lực (hôm nay hoặc hôm qua có học) */
  streak: number;
  bestStreak: number;
  badges: string[];
  lastActiveDay: string;
}

export const EMPTY_STARS: StarSummary = { total: 0, weeks: {}, today: 0, streak: 0, bestStreak: 0, badges: [], lastActiveDay: '' };

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Tuần ISO 8601 (thứ Hai là ngày đầu tuần), theo giờ máy */
export function weekKey(ts: number): string {
  const d = new Date(ts);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `w${t.getUTCFullYear()}_${pad(week)}`;
}

function prevDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1).getTime());
}

const examTier = (score: number) => (score >= 10 ? 3 : score >= 9 ? 2 : score >= 7 ? 1 : 0);

export function computeStars(attempts: Attempt[], now = Date.now()): StarSummary {
  const list = [...attempts].sort((a, b) => a.createdAt - b.createdAt);
  const perDay: Record<string, number> = {};
  const weeks: Record<string, number> = {};
  const wrongOpen = new Set<string>();
  const fixedOnce = new Set<string>();
  const bestTier: Record<string, number> = {};
  const examsDone = new Set<string>();
  let total = 0;
  let fixedCount = 0;
  let perfect = false;
  let anyQualified = false;
  let lastDay = '';
  let streak = 0;
  let bestStreak = 0;

  const add = (ts: number, n: number, capped: boolean) => {
    if (n <= 0) return;
    const day = dayKey(ts);
    const got = capped ? Math.max(0, Math.min(n, DAILY_CAP - (perDay[day] ?? 0))) : n;
    if (got <= 0) return;
    if (capped) perDay[day] = (perDay[day] ?? 0) + got;
    const wk = weekKey(ts);
    weeks[wk] = (weeks[wk] ?? 0) + got;
    total += got;
  };

  for (const at of list) {
    const results = at.results ?? [];
    const answered = results.filter((r) => String(r.userAnswer ?? '').trim() !== '').length;
    let earned = 0;
    let qualified = false;

    if (at.mode === 'exam') {
      qualified = at.total > 0 && answered >= at.total / 2;
      if (qualified) {
        earned += 1;
        const tier = examTier(at.score10);
        const key = at.refId === 'random' ? `random-${at.createdAt}` : at.refId;
        earned += Math.max(0, tier - (bestTier[key] ?? 0));
        bestTier[key] = Math.max(bestTier[key] ?? 0, tier);
        if (at.refId !== 'random') examsDone.add(at.refId);
        if (at.score10 >= 10) perfect = true;
      }
    } else {
      qualified = at.total >= 3 && answered >= Math.min(5, at.total);
      if (qualified) {
        earned += 1;
        if (at.correctCount / at.total >= 0.8) earned += 1;
      }
    }

    // Sửa được câu từng sai (chỉ xét câu đã trả lời)
    for (const r of results) {
      if (String(r.userAnswer ?? '').trim() === '') continue;
      if (r.correct) {
        if (wrongOpen.has(r.questionId) && !fixedOnce.has(r.questionId)) {
          earned += 1;
          fixedCount += 1;
          fixedOnce.add(r.questionId);
        }
        wrongOpen.delete(r.questionId);
      } else {
        wrongOpen.add(r.questionId);
      }
    }

    if (qualified) {
      anyQualified = true;
      const day = dayKey(at.createdAt);
      if (day !== lastDay) {
        earned += 1; // bài đầu tiên trong ngày
        streak = lastDay && prevDay(day) === lastDay ? streak + 1 : 1;
        bestStreak = Math.max(bestStreak, streak);
        lastDay = day;
        add(at.createdAt, STREAK_BONUS[streak] ?? 0, false);
      }
    }
    add(at.createdAt, earned, true);
  }

  const today = dayKey(now);
  const liveStreak = lastDay === today || lastDay === prevDay(today) ? streak : 0;

  const badges: string[] = [];
  if (anyQualified) badges.push('first');
  if (bestStreak >= 3) badges.push('streak3');
  if (bestStreak >= 7) badges.push('streak7');
  if (fixedCount >= 20) badges.push('fixer');
  if (examsDone.size >= 5) badges.push('exams5');
  if (perfect) badges.push('perfect');
  if (attempts.length && computeStats(attempts).topicStats.every((s) => s.level === 'good')) badges.push('allTopics');
  if (total >= 100) badges.push('stars100');

  return { total, weeks, today: perDay[today] ?? 0, streak: liveStreak, bestStreak, badges, lastActiveDay: lastDay };
}
