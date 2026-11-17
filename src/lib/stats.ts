import { TOPICS } from '../mockData';
import type { Attempt, Stats, TopicLevel, TopicStat } from '../types';

/** Chỉ tính N câu gần nhất của mỗi chủ đề để thấy được sự tiến bộ */
const RECENT_WINDOW = 30;

function levelOf(accuracy: number | null): TopicLevel {
  if (accuracy === null) return 'none';
  if (accuracy < 0.6) return 'weak';
  if (accuracy < 0.85) return 'ok';
  return 'good';
}

export function computeStats(attempts: Attempt[]): Stats {
  const chronological = [...attempts].sort((a, b) => a.createdAt - b.createdAt);

  const latestByQuestion = new Map<string, boolean>();
  const topicHistory: Record<string, boolean[]> = {};
  const topicAttemptCount: Record<string, number> = {};
  const examSummary: Stats['examSummary'] = {};
  const examScores: number[] = [];

  for (const at of chronological) {
    for (const r of at.results ?? []) {
      latestByQuestion.set(r.questionId, r.correct);
      (topicHistory[r.topicId] ??= []).push(r.correct);
    }
    for (const t of Object.keys(at.perTopic ?? {})) {
      topicAttemptCount[t] = (topicAttemptCount[t] ?? 0) + 1;
    }
    if (at.mode === 'exam') {
      examScores.push(at.score10);
      const cur = (examSummary[at.refId] ??= { best: 0, count: 0 });
      cur.count += 1;
      cur.best = Math.max(cur.best, at.score10);
    }
  }

  const topicStats: TopicStat[] = TOPICS.map((t) => {
    const recent = (topicHistory[t.id] ?? []).slice(-RECENT_WINDOW);
    const correct = recent.filter(Boolean).length;
    const accuracy = recent.length ? correct / recent.length : null;
    return {
      topicId: t.id,
      attemptCount: topicAttemptCount[t.id] ?? 0,
      correct,
      total: recent.length,
      accuracy,
      level: levelOf(accuracy),
    };
  });

  const weakTopics = topicStats
    .filter((s) => s.accuracy !== null && s.accuracy < 0.85)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

  const needReviewIds = [...latestByQuestion.entries()].filter(([, ok]) => !ok).map(([id]) => id);

  return {
    totalAttempts: attempts.length,
    examAttempts: examScores.length,
    practiceAttempts: attempts.length - examScores.length,
    avgExamScore: examScores.length ? Math.round((examScores.reduce((s, x) => s + x, 0) / examScores.length) * 10) / 10 : null,
    bestExamScore: examScores.length ? Math.max(...examScores) : null,
    topicStats,
    weakTopics,
    needReviewIds,
    examSummary,
  };
}
