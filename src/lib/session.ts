import { EXAM_DURATION_MIN, EXAMS, QUESTION_MAP, QUESTIONS, TOPICS } from '../mockData';
import type { Question, QuizSession, TopicId } from '../types';

const TOPIC_PRACTICE_SIZE = 10;
const REVIEW_SIZE = 15;
const RANDOM_EXAM_PER_TOPIC = 2;

export function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function questionsOfTopic(topicId: TopicId): Question[] {
  return QUESTIONS.filter((q) => q.topicId === topicId);
}

/** Luyện chủ đề: ưu tiên các câu lần trước làm sai, phần còn lại chọn ngẫu nhiên */
export function buildTopicSession(topicId: TopicId, needReviewIds: string[]): QuizSession {
  const all = questionsOfTopic(topicId);
  const reviewSet = new Set(needReviewIds);
  const wrongFirst = shuffle(all.filter((q) => reviewSet.has(q.id)));
  const others = shuffle(all.filter((q) => !reviewSet.has(q.id)));
  const topic = TOPICS.find((t) => t.id === topicId);
  return {
    mode: 'topic',
    refId: topicId,
    title: `Luyện chủ đề: ${topic?.name ?? topicId}`,
    questions: [...wrongFirst, ...others].slice(0, TOPIC_PRACTICE_SIZE),
    timeLimitSec: null,
  };
}

export function buildExamSession(examId: string): QuizSession {
  const exam = EXAMS.find((e) => e.id === examId);
  if (!exam) throw new Error(`Không tìm thấy đề ${examId}`);
  return {
    mode: 'exam',
    refId: exam.id,
    title: exam.title,
    questions: exam.questionIds.map((id) => QUESTION_MAP[id]).filter(Boolean),
    timeLimitSec: exam.durationMin * 60,
  };
}

/** Đề ngẫu nhiên: mỗi chủ đề 2 câu, xếp theo thứ tự chủ đề như đề thật */
export function buildRandomExamSession(): QuizSession {
  const questions = TOPICS.flatMap((t) => shuffle(questionsOfTopic(t.id)).slice(0, RANDOM_EXAM_PER_TOPIC));
  return {
    mode: 'exam',
    refId: 'random',
    title: 'Đề ngẫu nhiên tổng hợp',
    questions,
    timeLimitSec: EXAM_DURATION_MIN * 60,
  };
}

export function buildReviewSession(needReviewIds: string[]): QuizSession {
  const questions = shuffle(needReviewIds.map((id) => QUESTION_MAP[id]).filter(Boolean)).slice(0, REVIEW_SIZE);
  return {
    mode: 'review',
    refId: 'review-wrong',
    title: 'Ôn lại các câu còn sai',
    questions,
    timeLimitSec: null,
  };
}
