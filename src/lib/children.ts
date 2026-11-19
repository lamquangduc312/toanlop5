import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ATTEMPTS_COLLECTION, CHILDREN_COLLECTION, LEGACY_CHILD_ID, LEGACY_OWNER_EMAIL, db } from './firebase';
import { weekKey, type StarSummary } from './stars';

/** Hồ sơ bé – đọc công khai cho bảng xếp hạng nên CHỈ chứa biệt danh, hình đại diện, lớp và sao */
export interface Child {
  id: string;
  ownerUid: string;
  nickname: string;
  avatar: string;
  className: string;
  school: string;
  classKey: string;
  totalStars: number;
  weeks: Record<string, number>;
  streak: number;
  bestStreak: number;
  badges: string[];
  lastActiveDay: string;
  consentAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface ChildInput {
  nickname: string;
  avatar: string;
  className: string;
  school: string;
}

export const AVATARS = ['🐼', '🐰', '🦊', '🐱', '🐶', '🐯', '🦁', '🐨', '🐸', '🐧', '🦄', '🐬', '🦋', '🐝', '🌸', '🚀'];

const childrenCol = () => collection(db!, CHILDREN_COLLECTION);

function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/^((truong|tieu hoc|thcs|thpt|th)\s+)+/, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Khoá so khớp "cùng lớp": 5A7 + Đại Kim → "5a7|daikim" (không phân biệt dấu, hoa thường, dấu cách) */
export function classKeyOf(className: string, school: string): string {
  return `${fold(className)}|${fold(school)}`;
}

function toChild(id: string, data: Record<string, unknown>): Child {
  return <Child>{
    totalStars: 0,
    weeks: {},
    streak: 0,
    bestStreak: 0,
    badges: [],
    lastActiveDay: '',
    school: '',
    ...(data as Partial<Child>),
    id,
  };
}

export async function listMyChildren(uid: string): Promise<Child[]> {
  if (!db) return [];
  const snap = await getDocs(query(childrenCol(), where('ownerUid', '==', uid)));
  return snap.docs.map((d) => toChild(d.id, d.data())).sort((a, b) => a.createdAt - b.createdAt);
}

function profileFields(input: ChildInput) {
  const nickname = input.nickname.trim().slice(0, 24);
  const className = input.className.trim().toUpperCase().slice(0, 12);
  const school = input.school.trim().slice(0, 40);
  return { nickname, avatar: input.avatar, className, school, classKey: classKeyOf(className, school) };
}

export async function createChild(uid: string, input: ChildInput, fixedId?: string): Promise<Child> {
  const now = Date.now();
  const data = {
    ownerUid: uid,
    ...profileFields(input),
    totalStars: 0,
    weeks: {},
    streak: 0,
    bestStreak: 0,
    badges: [],
    lastActiveDay: '',
    consentAt: now,
    createdAt: now,
    updatedAt: now,
  };
  if (fixedId) {
    await setDoc(doc(db!, CHILDREN_COLLECTION, fixedId), data);
    return toChild(fixedId, data);
  }
  const ref = await addDoc(childrenCol(), data);
  return toChild(ref.id, data);
}

export async function updateChildProfile(childId: string, input: ChildInput): Promise<void> {
  await updateDoc(doc(db!, CHILDREN_COLLECTION, childId), { ...profileFields(input), updatedAt: Date.now() });
}

/** Ghi sao lên hồ sơ (để xếp hạng). Giữ 8 tuần gần nhất. Không bao giờ ghi tổng sao thấp hơn hiện có. */
export async function saveProgress(child: Child, s: StarSummary): Promise<Child | null> {
  if (!db) return null;
  const keys = Object.keys(s.weeks).sort().slice(-8);
  const weeks = Object.fromEntries(keys.map((k) => [k, s.weeks[k]]));
  const next = {
    totalStars: Math.max(child.totalStars, s.total),
    weeks,
    streak: s.streak,
    bestStreak: s.bestStreak,
    badges: s.badges,
    lastActiveDay: s.lastActiveDay,
  };
  const same =
    next.totalStars === child.totalStars &&
    JSON.stringify(next.weeks) === JSON.stringify(child.weeks) &&
    next.streak === child.streak &&
    next.badges.join() === child.badges.join();
  if (same) return null;
  await updateDoc(doc(db, CHILDREN_COLLECTION, child.id), { ...next, updatedAt: Date.now() });
  return { ...child, ...next };
}

/** Xoá hồ sơ bé cùng toàn bộ bài làm (quyền xoá dữ liệu của phụ huynh) */
export async function deleteChild(uid: string, childId: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db!, ATTEMPTS_COLLECTION), where('ownerUid', '==', uid), where('studentId', '==', childId)),
  );
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db!, CHILDREN_COLLECTION, childId));
}

/**
 * Tài khoản lamquangduc312@gmail.com: nhận hồ sơ cũ của bé Hà Ngân (mã lam-ha-ngan-5a7)
 * và gắn các bài làm cũ vào tài khoản. Chạy lại nhiều lần cũng an toàn.
 */
export async function claimLegacy(user: User): Promise<boolean> {
  if (!db || user.email?.toLowerCase() !== LEGACY_OWNER_EMAIL) return false;
  const ref = doc(db, CHILDREN_COLLECTION, LEGACY_CHILD_ID);
  const existing = await getDoc(ref);
  if (existing.exists() && existing.data().ownerUid !== user.uid) return false;
  if (!existing.exists()) {
    await createChild(user.uid, { nickname: 'Ngân', avatar: '🐼', className: '5A', school: 'Đại Kim' }, LEGACY_CHILD_ID);
  }
  const snap = await getDocs(query(collection(db, ATTEMPTS_COLLECTION), where('studentId', '==', LEGACY_CHILD_ID)));
  const todo = snap.docs.filter((d) => !d.data().ownerUid);
  await Promise.all(todo.map((d) => updateDoc(d.ref, { ownerUid: user.uid })));
  return true;
}

// ---------- Bảng xếp hạng ----------

export type RankKind = 'week' | 'total';

export function rankField(kind: RankKind, now = Date.now()): string {
  return kind === 'week' ? `weeks.${weekKey(now)}` : 'totalStars';
}

export function starsOf(child: Child, kind: RankKind, now = Date.now()): number {
  return kind === 'week' ? (child.weeks?.[weekKey(now)] ?? 0) : child.totalStars;
}

/** Top N toàn web – dùng chỉ mục một trường tự động của Firestore (không cần tạo index) */
export async function loadTop(kind: RankKind, n = 20): Promise<Child[]> {
  if (!db) return [];
  const snap = await getDocs(query(childrenCol(), orderBy(rankField(kind), 'desc'), limit(n)));
  return snap.docs.map((d) => toChild(d.id, d.data())).filter((c) => starsOf(c, kind) > 0);
}

/** Các bạn cùng lớp (lọc bằng một điều kiện bằng → không cần index; sắp xếp ở máy) */
export async function loadClassmates(classKey: string): Promise<Child[]> {
  if (!db) return [];
  const snap = await getDocs(query(childrenCol(), where('classKey', '==', classKey)));
  return snap.docs.map((d) => toChild(d.id, d.data()));
}

/** Hạng của bé = số bạn có nhiều sao hơn + 1 */
export async function rankOf(kind: RankKind, stars: number): Promise<number | null> {
  if (!db || stars <= 0) return null;
  const snap = await getCountFromServer(query(childrenCol(), where(rankField(kind), '>', stars)));
  return snap.data().count + 1;
}
