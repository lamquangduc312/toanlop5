import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from './firebase';

/** Trình duyệt nhúng trong Zalo / Facebook / Messenger… – Google chặn đăng nhập ở đây */
export function isInAppBrowser(): boolean {
  return /Zalo|FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|Line\//i.test(navigator.userAgent);
}

export async function signInWithGoogle(): Promise<void> {
  if (!auth) throw new Error('Chưa cấu hình Firebase');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return;
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
    throw err;
  }
}

export function signOutUser(): Promise<void> {
  return auth ? signOut(auth) : Promise.resolve();
}

/** `ready` = đã biết chắc có / không có người đăng nhập (tránh nháy giao diện khách lúc mở web) */
export function useAuthUser(): { user: User | null; ready: boolean } {
  const [state, setState] = useState<{ user: User | null; ready: boolean }>({ user: null, ready: !auth });
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => setState({ user, ready: true }));
  }, []);
  return state;
}
