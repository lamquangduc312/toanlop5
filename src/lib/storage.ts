import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { Attempt } from '../types';
import { ATTEMPTS_COLLECTION, db } from './firebase';

/**
 * Lưu bài làm.
 * - Đã đăng nhập (owner): lưu Firestore, gắn ownerUid + mã bé. Mất mạng → lưu tạm trên máy, tự đẩy lên lần sau.
 * - Khách (chưa đăng nhập): lưu trên trình duyệt (không có ownerUid); khi đăng nhập có thể chuyển vào hồ sơ bé.
 */

const LOCAL_KEY = 'toan5-ha-ngan:attempts';
const FIREBASE_TIMEOUT_MS = 8000;

export interface Owner {
  uid: string;
  childId: string;
  nickname: string;
}

export type DataSource = 'firebase' | 'local' | 'guest';

export interface SaveResult {
  id: string;
  where: DataSource;
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

const isGuestAttempt = (a: Attempt) => !a.ownerUid;
const belongsTo = (a: Attempt, owner: Owner) => a.ownerUid === owner.uid && a.studentId === owner.childId;

function stamp(attempt: Attempt, owner: Owner): Attempt {
  return { ...attempt, ownerUid: owner.uid, studentId: owner.childId, studentName: owner.nickname };
}

export async function saveAttempt(attempt: Attempt, owner: Owner | null): Promise<SaveResult> {
  const id = `local-${attempt.createdAt}`;
  if (!owner || !db) {
    writeLocal([{ ...attempt, id }, ...readLocal()]);
    return { id, where: owner ? 'local' : 'guest' };
  }
  const data = stamp(attempt, owner);
  try {
    const ref = await withTimeout(addDoc(collection(db, ATTEMPTS_COLLECTION), stripId(data)));
    return { id: ref.id, where: 'firebase' };
  } catch (err) {
    console.error('[saveAttempt] Firebase lỗi, lưu tạm vào máy:', err);
    writeLocal([{ ...data, id }, ...readLocal()]);
    return { id, where: 'local', note: 'Không kết nối được mạng – đã lưu tạm trên máy, sẽ tự đồng bộ lần sau.' };
  }
}

/** Đẩy các bài lưu tạm (của đúng phụ huynh đang đăng nhập) lên Firebase */
async function syncPending(owner: Owner): Promise<void> {
  if (!db) return;
  const all = readLocal();
  const pending = all.filter((a) => a.ownerUid === owner.uid);
  if (pending.length === 0) return;
  const failed = new Set<Attempt>();
  for (const attempt of pending) {
    try {
      await withTimeout(addDoc(collection(db, ATTEMPTS_COLLECTION), stripId(attempt)));
    } catch {
      failed.add(attempt);
    }
  }
  writeLocal(all.filter((a) => a.ownerUid !== owner.uid || failed.has(a)));
}

export async function loadAttempts(owner: Owner | null): Promise<{ attempts: Attempt[]; source: DataSource }> {
  const byNewest = (a: Attempt, b: Attempt) => b.createdAt - a.createdAt;
  if (!owner) return { attempts: readLocal().filter(isGuestAttempt).sort(byNewest), source: 'guest' };
  if (db) {
    try {
      await syncPending(owner);
      // Hai điều kiện "bằng" → Firestore tự ghép chỉ mục, không cần tạo composite index.
      const snap = await withTimeout(
        getDocs(
          query(collection(db, ATTEMPTS_COLLECTION), where('ownerUid', '==', owner.uid), where('studentId', '==', owner.childId)),
        ),
      );
      const remote = snap.docs.map((d) => ({ ...(d.data() as Attempt), id: d.id }));
      const local = readLocal().filter((a) => belongsTo(a, owner));
      return { attempts: [...remote, ...local].sort(byNewest), source: 'firebase' };
    } catch (err) {
      console.error('[loadAttempts] Firebase lỗi, đọc dữ liệu trên máy:', err);
    }
  }
  return { attempts: readLocal().filter((a) => belongsTo(a, owner)).sort(byNewest), source: 'local' };
}

/** Số bài làm lúc chưa đăng nhập đang nằm trên máy này */
export function countGuestAttempts(): number {
  return readLocal().filter(isGuestAttempt).length;
}

/** Chuyển các bài làm lúc chưa đăng nhập vào hồ sơ bé */
export async function importGuestAttempts(owner: Owner): Promise<number> {
  if (!db) return 0;
  const all = readLocal();
  const done = new Set<Attempt>();
  for (const a of all.filter(isGuestAttempt)) {
    try {
      await withTimeout(addDoc(collection(db, ATTEMPTS_COLLECTION), stripId(stamp(a, owner))));
      done.add(a);
    } catch (err) {
      console.error('[importGuestAttempts]', err);
    }
  }
  writeLocal(all.filter((a) => !done.has(a)));
  return done.size;
}
