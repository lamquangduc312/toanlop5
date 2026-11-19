import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuthUser } from './auth';
import { claimLegacy, createChild, deleteChild, listMyChildren, updateChildProfile, type Child, type ChildInput } from './children';
import { EMPTY_STARS, type StarSummary } from './stars';

const ACTIVE_KEY = 'toan5:active-child:';

function readActive(uid: string): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY + uid);
  } catch {
    return null;
  }
}

function writeActive(uid: string, childId: string) {
  try {
    localStorage.setItem(ACTIVE_KEY + uid, childId);
  } catch {
    /* bỏ qua */
  }
}

/** Phụ huynh đăng nhập + các hồ sơ bé + bé đang học */
export function useAccount() {
  const { user, ready: authReady } = useAuthUser();
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null | undefined>(undefined);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setChildren([]);
      setActiveId(null);
      setLoadedFor(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await claimLegacy(user);
      } catch (err) {
        console.error('[claimLegacy]', err);
      }
      let list: Child[] = [];
      try {
        list = await listMyChildren(user.uid);
      } catch (err) {
        console.error('[listMyChildren]', err);
      }
      if (cancelled) return;
      setChildren(list);
      const saved = readActive(user.uid);
      setActiveId(list.find((c) => c.id === saved)?.id ?? list[0]?.id ?? null);
      setLoadedFor(user.uid);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, authReady]);

  const child = children.find((c) => c.id === activeId) ?? null;

  const selectChild = useCallback(
    (id: string) => {
      setActiveId(id);
      if (uid) writeActive(uid, id);
    },
    [uid],
  );

  const addChild = async (input: ChildInput) => {
    if (!uid) return;
    const c = await createChild(uid, input);
    setChildren((prev) => [...prev, c]);
    selectChild(c.id);
  };

  const editChild = async (id: string, input: ChildInput) => {
    await updateChildProfile(id, input);
    const fresh = await listMyChildren(uid!);
    setChildren(fresh);
  };

  const removeChild = async (id: string) => {
    if (!uid) return;
    await deleteChild(uid, id);
    const rest = children.filter((c) => c.id !== id);
    setChildren(rest);
    if (activeId === id && rest[0]) selectChild(rest[0].id);
    if (rest.length === 0) setActiveId(null);
  };

  const replaceChild = useCallback((c: Child) => setChildren((prev) => prev.map((x) => (x.id === c.id ? c : x))), []);

  return {
    user,
    /** Đã biết trạng thái đăng nhập và đã tải xong hồ sơ các bé */
    ready: authReady && loadedFor === uid,
    children,
    child,
    selectChild,
    addChild,
    editChild,
    removeChild,
    replaceChild,
  };
}

export type Account = ReturnType<typeof useAccount>;

export interface LearnerInfo {
  /** Biệt danh bé đang học, hoặc "bạn" khi chưa đăng nhập */
  name: string;
  loggedIn: boolean;
  child: Child | null;
  stars: StarSummary;
  openAccount: () => void;
}

export const LearnerContext = createContext<LearnerInfo>({
  name: 'bạn',
  loggedIn: false,
  child: null,
  stars: EMPTY_STARS,
  openAccount: () => {},
});

export const useLearner = () => useContext(LearnerContext);
