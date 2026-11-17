import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { Attempt } from '../types';
import { ATTEMPTS_COLLECTION, db } from './firebase';

const LOCAL_KEY = 'toan5-ha-ngan:attempts';
const FIREBASE_TIMEOUT_MS = 8000;

export interface SaveResult {
  id: string;
  where: 'firebase' | 'local';
  note?: string;
}

function readLocal(): Attempt[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Attempt[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: Attempt[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* bộ nhớ trình duyệt đầy hoặc bị chặn – bỏ qua */
  }
}

/** Firestore treo vô thời hạn khi mất mạng → giới hạn thời gian chờ */
function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Hết thời gian kết nối Firebase')), FIREBASE_TIMEOUT_MS)),
  ]);
}

function stripId(attempt: Attempt): Attempt {
  const copy: Attempt = { ...attempt };
  delete copy.id;
  return copy;
}

export async function saveAttempt(attempt: Attempt): Promise<SaveResult> {
  if (db) {
    try {
      const ref = await withTimeout(addDoc(collection(db, ATTEMPTS_COLLECTION), stripId(attempt)));
      return { id: ref.id, where: 'firebase' };
    } catch (err) {
      console.error('[saveAttempt] Firebase lỗi, lưu tạm vào máy:', err);
      const id = `local-${attempt.createdAt}`;
      writeLocal([{ ...attempt, id }, ...readLocal()]);
      return { id, where: 'local', note: 'Không kết nối được Firebase – đã lưu tạm trên máy, sẽ tự đồng bộ lần sau.' };
    }
  }
  const id = `local-${attempt.createdAt}`;
  writeLocal([{ ...attempt, id }, ...readLocal()]);
  return { id, where: 'local' };
}

/** Đẩy các bài lưu tạm trên máy lên Firebase (khi đã cấu hình và có mạng) */
async function syncLocalToFirebase(): Promise<void> {
  if (!db) return;
  const pending = readLocal();
  if (pending.length === 0) return;
  const remaining: Attempt[] = [];
  for (const attempt of pending) {
    try {
      await withTimeout(addDoc(collection(db, ATTEMPTS_COLLECTION), stripId(attempt)));
    } catch {
      remaining.push(attempt);
    }
  }
  writeLocal(remaining);
}

export async function loadAttempts(studentId: string): Promise<{ attempts: Attempt[]; source: 'firebase' | 'local' }> {
  if (db) {
    try {
      await syncLocalToFirebase();
      // Chỉ lọc theo studentId (không orderBy) để không cần tạo composite index; sắp xếp ở client.
      const snap = await withTimeout(getDocs(query(collection(db, ATTEMPTS_COLLECTION), where('studentId', '==', studentId))));
      const remote = snap.docs.map((d) => ({ ...(d.data() as Attempt), id: d.id }));
      const local = readLocal().filter((a) => a.studentId === studentId);
      return { attempts: [...remote, ...local].sort((a, b) => b.createdAt - a.createdAt), source: 'firebase' };
    } catch (err) {
      console.error('[loadAttempts] Firebase lỗi, đọc dữ liệu trên máy:', err);
    }
  }
  const local = readLocal()
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => b.createdAt - a.createdAt);
  return { attempts: local, source: 'local' };
}
