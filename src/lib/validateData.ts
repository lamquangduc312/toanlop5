/**
 * Kiểm tra toàn bộ ngân hàng câu hỏi và đề thi trước khi đưa lên web.
 * Chạy bằng:  npm run check   (tự động chạy trong npm run sync)
 */
import { EXAMS, QUESTIONS, TOPICS } from '../mockData';
import type { TopicId } from '../types';
import { isCorrect } from './grading';

/** Tiền tố mã câu hỏi theo chủ đề – mã câu mới nên theo đúng quy ước này */
export const ID_PREFIX: Record<TopicId, string> = {
  'doc-viet-stp': 'dv',
  'so-sanh-stp': 'ss',
  'lam-tron': 'lt',
  'phan-so-tp': 'ps',
  'doi-don-vi': 'dd',
  'dien-tich': 'dt',
  'tinh-toan': 'tt',
  'loi-van': 'lv',
};

export interface ValidationReport {
  errors: string[];
  warnings: string[];
  questionCount: number;
  examCount: number;
  perTopic: { topic: string; count: number; nextId: string }[];
}

export function validateData(): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const topicIds = new Set(TOPICS.map((t) => t.id));

  const seen = new Set<string>();
  for (const q of QUESTIONS) {
    const where = `Câu "${q.id}"`;
    if (seen.has(q.id)) errors.push(`${where}: mã câu bị TRÙNG – đổi sang mã khác.`);
    seen.add(q.id);

    if (!topicIds.has(q.topicId)) errors.push(`${where}: chủ đề "${q.topicId}" không tồn tại.`);
    else if (!new RegExp(`^${ID_PREFIX[q.topicId]}\\d+[a-z]?$`).test(q.id))
      warnings.push(`${where}: mã nên bắt đầu bằng "${ID_PREFIX[q.topicId]}" cho chủ đề ${q.topicId}.`);

    if (!q.prompt.trim()) errors.push(`${where}: thiếu đề bài.`);
    if (!q.explanation.trim()) errors.push(`${where}: thiếu hướng dẫn giải.`);
    if (!q.source.trim()) warnings.push(`${where}: thiếu nguồn đề.`);
    if (q.points != null && !(q.points > 0)) errors.push(`${where}: điểm phải lớn hơn 0.`);

    if (q.type === 'mc') {
      if (q.options.length < 2) errors.push(`${where}: trắc nghiệm cần ít nhất 2 phương án.`);
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length)
        errors.push(`${where}: đáp án đúng phải là 0 (A) đến ${q.options.length - 1} (${String.fromCharCode(64 + q.options.length)}).`);
      if (new Set(q.options.map((o) => o.trim())).size !== q.options.length) warnings.push(`${where}: có 2 phương án giống hệt nhau.`);
    } else {
      if (q.answers.length === 0 || q.answers.some((a) => !a.trim())) errors.push(`${where}: thiếu đáp án.`);
      else if (!isCorrect(q, q.answers[0])) errors.push(`${where}: đáp án "${q.answers[0]}" không tự chấm đúng được – kiểm tra cách viết.`);
      for (const a of q.answers) {
        if (/^\d+\.\d+$/.test(a.trim())) warnings.push(`${where}: đáp án "${a}" dùng dấu chấm – số thập phân nên viết dấu phẩy (vd 0,75).`);
      }
    }
  }

  const examIds = new Set<string>();
  for (const e of EXAMS) {
    const where = `Đề "${e.id}"`;
    if (examIds.has(e.id)) errors.push(`${where}: mã đề bị TRÙNG.`);
    examIds.add(e.id);
    if (!/^[a-z0-9-]+$/.test(e.id)) errors.push(`${where}: mã đề chỉ dùng chữ thường không dấu, số và dấu gạch ngang.`);
    if (e.durationMin <= 0) errors.push(`${where}: thời gian làm bài phải lớn hơn 0.`);
    const missing = e.questionIds.filter((id) => !seen.has(id));
    if (missing.length) errors.push(`${where}: không tìm thấy câu ${missing.join(', ')}.`);
    const dup = e.questionIds.filter((id, i) => e.questionIds.indexOf(id) !== i);
    if (dup.length) errors.push(`${where}: câu bị lặp trong đề: ${[...new Set(dup)].join(', ')}.`);
    if (e.questionIds.length < 6 || e.questionIds.length > 25)
      warnings.push(`${where}: có ${e.questionIds.length} câu (đề 40 phút thường 10 – 18 câu).`);
  }

  const perTopic = TOPICS.map((t) => {
    const prefix = ID_PREFIX[t.id];
    const nums = QUESTIONS.filter((q) => q.topicId === t.id)
      .map((q) => Number(q.id.match(new RegExp(`^${prefix}(\\d+)`))?.[1] ?? 0));
    return {
      topic: `${t.emoji} ${t.name}`,
      count: nums.length,
      nextId: `${prefix}${Math.max(0, ...nums) + 1}`,
    };
  });

  return { errors, warnings, questionCount: QUESTIONS.length, examCount: EXAMS.length, perTopic };
}
