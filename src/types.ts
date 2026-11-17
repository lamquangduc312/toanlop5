export type TopicId =
  | 'doc-viet-stp'
  | 'so-sanh-stp'
  | 'lam-tron'
  | 'phan-so-tp'
  | 'doi-don-vi'
  | 'dien-tich'
  | 'tinh-toan'
  | 'loi-van';

export interface Topic {
  id: TopicId;
  name: string;
  description: string;
  /** Mẹo giải rút ra từ phần "Hướng dẫn giải" của các đề */
  tips: string[];
  emoji: string;
  /** Lớp Tailwind cho nền + chữ của nhãn */
  accent: string;
  /** Lớp Tailwind cho thanh tiến độ */
  bar: string;
  /** Nền nhạt của thẻ chủ đề */
  soft: string;
  border: string;
  text: string;
  /** Màu nút bấm "lún" (dùng cùng lớp .btn) */
  btn: string;
}

interface BaseQuestion {
  id: string;
  topicId: TopicId;
  prompt: string;
  /** Hướng dẫn giải hiển thị sau khi chấm */
  explanation: string;
  /** Nguồn đề gốc */
  source: string;
  /** Điểm của câu; mặc định: trắc nghiệm 0,5 – điền số 1 – lời văn 2 */
  points?: number;
}

export interface MCQuestion extends BaseQuestion {
  type: 'mc';
  options: string[];
  /** Chỉ số (0-based) của phương án đúng */
  answer: number;
}

export interface InputQuestion extends BaseQuestion {
  type: 'input';
  /** Các đáp án được chấp nhận (so sánh theo giá trị số nếu là số) */
  answers: string[];
  unit?: string;
}

export type Question = MCQuestion | InputQuestion;

export interface Exam {
  id: string;
  title: string;
  source: string;
  durationMin: number;
  questionIds: string[];
}

export type QuizMode = 'topic' | 'exam' | 'review';

export interface QuizSession {
  mode: QuizMode;
  refId: string;
  title: string;
  questions: Question[];
  /** null = không giới hạn thời gian */
  timeLimitSec: number | null;
}

export interface QuestionResult {
  questionId: string;
  topicId: TopicId;
  userAnswer: string;
  correct: boolean;
  points: number;
  earned: number;
}

export interface TopicScore {
  correct: number;
  total: number;
}

export interface Attempt {
  id?: string;
  studentId: string;
  studentName: string;
  mode: QuizMode;
  refId: string;
  title: string;
  score10: number;
  earned: number;
  maxPoints: number;
  correctCount: number;
  total: number;
  durationSec: number;
  timeLimitSec: number | null;
  timedOut: boolean;
  perTopic: Partial<Record<TopicId, TopicScore>>;
  wrongQuestionIds: string[];
  results: QuestionResult[];
  createdAt: number;
}

export type TopicLevel = 'none' | 'weak' | 'ok' | 'good';

export interface TopicStat {
  topicId: TopicId;
  attemptCount: number;
  correct: number;
  total: number;
  accuracy: number | null;
  level: TopicLevel;
}

export interface Stats {
  totalAttempts: number;
  examAttempts: number;
  practiceAttempts: number;
  avgExamScore: number | null;
  bestExamScore: number | null;
  topicStats: TopicStat[];
  weakTopics: TopicStat[];
  /** Câu mà lần làm gần nhất còn sai */
  needReviewIds: string[];
  examSummary: Record<string, { best: number; count: number }>;
}

export type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved'; where: 'firebase' | 'local'; note?: string };
