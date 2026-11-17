import { ArrowDownUp, Calculator, CircleDot, Divide, Hash, MessageSquareText, Scale, Square, type LucideIcon } from 'lucide-react';
import type { TopicId } from '../types';

const ICONS: Record<TopicId, LucideIcon> = {
  'doc-viet-stp': Hash,
  'so-sanh-stp': ArrowDownUp,
  'lam-tron': CircleDot,
  'phan-so-tp': Divide,
  'doi-don-vi': Scale,
  'dien-tich': Square,
  'tinh-toan': Calculator,
  'loi-van': MessageSquareText,
};

export default function TopicIcon({ topicId, className = 'h-5 w-5' }: { topicId: TopicId; className?: string }) {
  const Icon = ICONS[topicId];
  return <Icon className={className} aria-hidden />;
}
