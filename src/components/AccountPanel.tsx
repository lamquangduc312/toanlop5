import { Copy, Loader2, LogOut, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { isInAppBrowser, signInWithGoogle, signOutUser } from '../lib/auth';
import type { Account } from '../lib/account';
import { AVATARS, type Child, type ChildInput } from '../lib/children';
import { isFirebaseConfigured } from '../lib/firebase';

interface Props {
  account: Account;
  onClose: () => void;
}

function ChildForm({ initial, onSubmit, onCancel }: { initial?: Child; onSubmit: (v: ChildInput) => Promise<void>; onCancel?: () => void }) {
  const [v, setV] = useState<ChildInput>({
    nickname: initial?.nickname ?? '',
    avatar: initial?.avatar ?? AVATARS[0],
    className: initial?.className ?? '',
    school: initial?.school ?? '',
  });
  const [consent, setConsent] = useState(Boolean(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const valid = v.nickname.trim().length > 0 && v.className.trim().length > 0 && consent;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit(v);
    } catch (err) {
      console.error(err);
      setError('Chưa lưu được, bạn thử lại nhé.');
      setBusy(false);
    }
  };

  const input = 'mt-1 w-full rounded-2xl border-2 border-slate-200 px-3 py-2 text-base outline-none focus:border-pink-400';

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        Biệt danh của bé <span className="font-normal text-slate-500">(hiện trên bảng xếp hạng)</span>
        <input className={input} maxLength={24} placeholder="Ví dụ: Ngân" value={v.nickname} onChange={(e) => setV({ ...v, nickname: e.target.value })} />
      </label>
      <div>
        <p className="text-sm font-semibold text-slate-700">Hình đại diện</p>
        <div className="mt-1 grid grid-cols-8 gap-1.5">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setV({ ...v, avatar: a })}
              className={`grid aspect-square place-items-center rounded-xl text-2xl ${v.avatar === a ? 'bg-pink-100 ring-2 ring-pink-400' : 'bg-slate-50 hover:bg-slate-100'}`}
              aria-label={`Chọn ${a}`}
              aria-pressed={v.avatar === a}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[6rem_1fr] gap-2">
        <label className="block text-sm font-semibold text-slate-700">
          Lớp
          <input className={input} maxLength={12} placeholder="5A7" value={v.className} onChange={(e) => setV({ ...v, className: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Trường <span className="font-normal text-slate-500">(không bắt buộc)</span>
          <input className={input} maxLength={40} placeholder="Đại Kim" value={v.school} onChange={(e) => setV({ ...v, school: e.target.value })} />
        </label>
      </div>
      <p className="text-xs text-slate-500">Lớp + trường dùng để lọc "Bạn cùng lớp" trên bảng xếp hạng.</p>
      {!initial && (
        <label className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-slate-700">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-pink-500" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            Tôi là bố/mẹ (người giám hộ) của bé, đồng ý lưu kết quả học tập của bé và hiển thị <b>biệt danh, hình đại diện, lớp, số sao</b> trên
            bảng xếp hạng.
          </span>
        </label>
      )}
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={!valid || busy} className="btn btn-pink flex-1 disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {initial ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-white">
            Huỷ
          </button>
        )}
      </div>
    </form>
  );
}

function LoginBox() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const inApp = isInAppBrowser();

  const login = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      const code = (err as { code?: string }).code ?? '';
      setError(
        code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found' || code === 'auth/unauthorized-domain'
          ? 'Web đang được cài đặt đăng nhập Google, bạn thử lại sau ít phút nhé.'
          : code === 'auth/network-request-failed'
            ? 'Mất kết nối mạng – kiểm tra mạng rồi thử lại.'
            : inApp
              ? 'Google không cho đăng nhập trong Zalo/Facebook – hãy mở link bằng Chrome hoặc Safari.'
              : `Chưa đăng nhập được (${code || 'lỗi không rõ'}). Bạn thử lại nhé.`,
      );
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-slate-700">
        Bố/mẹ đăng nhập Gmail <b>một lần</b> trên máy này để bé được <b>tích sao ⭐ và lên bảng xếp hạng</b>. Lần sau mở web là vào học luôn.
      </p>
      <ul className="space-y-1 text-sm text-slate-600">
        <li>✅ Một tài khoản tạo được nhiều hồ sơ (anh chị em dùng chung).</li>
        <li>✅ Học trên máy khác: đăng nhập cùng Gmail là thấy đủ kết quả.</li>
        <li>✅ Không đăng nhập vẫn học được – kết quả lưu trên máy này.</li>
      </ul>
      {inApp && (
        <div className="rounded-2xl bg-amber-100 p-3 text-sm text-amber-900">
          <p className="font-bold">⚠️ Bạn đang mở web trong Zalo / Facebook</p>
          <p className="mt-1">Google không cho đăng nhập ở đây. Bấm ⋯ ở góc trên → "Mở bằng trình duyệt", hoặc sao chép link dán vào Chrome / Safari.</p>
          <button onClick={copy} className="btn btn-white mt-2 px-3 py-1.5 text-sm">
            <Copy className="h-4 w-4" /> {copied ? 'Đã sao chép!' : 'Sao chép link'}
          </button>
        </div>
      )}
      <button onClick={login} disabled={busy} className="btn btn-white w-full justify-center text-base">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="font-display text-xl font-extrabold text-sky-600">G</span>}
        Đăng nhập bằng Google
      </button>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}

export default function AccountPanel({ account, onClose }: Props) {
  const { user, ready, children, child } = account;
  const [mode, setMode] = useState<'view' | 'add' | 'edit'>('view');
  const [busy, setBusy] = useState(false);

  const remove = async (c: Child) => {
    if (!window.confirm(`Xoá hồ sơ "${c.nickname}" cùng toàn bộ bài làm và sao? Không khôi phục được.`)) return;
    setBusy(true);
    try {
      await account.removeChild(c.id);
    } finally {
      setBusy(false);
    }
  };

  const showForm = user && ready && (children.length === 0 || mode === 'add');

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-pop sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tài khoản"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold text-slate-800">
            {!user ? '⭐ Lưu sao cho bé' : showForm ? '🧒 Tạo hồ sơ bé' : mode === 'edit' ? '✏️ Sửa hồ sơ' : '👨‍👩‍👧 Tài khoản'}
          </h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isFirebaseConfigured && <p className="text-slate-600">Web chưa kết nối Firebase nên chưa đăng nhập được.</p>}

        {isFirebaseConfigured && !user && <LoginBox />}

        {user && !ready && (
          <p className="flex items-center gap-2 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" /> Đang tải hồ sơ…
          </p>
        )}

        {showForm && (
          <ChildForm
            onSubmit={async (v) => {
              await account.addChild(v);
              setMode('view');
            }}
            onCancel={children.length ? () => setMode('view') : undefined}
          />
        )}

        {user && ready && mode === 'edit' && child && (
          <ChildForm
            initial={child}
            onSubmit={async (v) => {
              await account.editChild(child.id, v);
              setMode('view');
            }}
            onCancel={() => setMode('view')}
          />
        )}

        {user && ready && children.length > 0 && mode === 'view' && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-500">Ai đang học?</p>
              <div className="space-y-2">
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      account.selectChild(c.id);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left ${c.id === child?.id ? 'border-pink-400 bg-pink-50' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <span className="text-3xl">{c.avatar}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg font-bold text-slate-800">{c.nickname}</span>
                      <span className="block text-xs text-slate-500">
                        Lớp {c.className}
                        {c.school ? ` · ${c.school}` : ''}
                      </span>
                    </span>
                    <span className="chip bg-amber-100 text-amber-700">⭐ {c.totalStars}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setMode('add')} className="btn btn-white px-3 py-1.5 text-sm">
                <Plus className="h-4 w-4" /> Thêm bé
              </button>
              {child && (
                <>
                  <button onClick={() => setMode('edit')} className="btn btn-white px-3 py-1.5 text-sm">
                    <Pencil className="h-4 w-4" /> Sửa hồ sơ {child.nickname}
                  </button>
                  <button onClick={() => remove(child)} disabled={busy} className="btn btn-white px-3 py-1.5 text-sm text-red-600">
                    <Trash2 className="h-4 w-4" /> Xoá
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {user && (
          <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
            <span className="truncate">Đăng nhập: {user.email}</span>
            <button
              onClick={() => {
                void signOutUser();
                onClose();
              }}
              className="btn btn-white shrink-0 px-3 py-1.5 text-sm"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </button>
          </div>
        )}

        <details className="mt-4 text-xs text-slate-500">
          <summary className="cursor-pointer font-semibold">🔒 Quyền riêng tư</summary>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Gmail chỉ dùng để đăng nhập, không hiển thị cho ai.</li>
            <li>Bảng xếp hạng chỉ hiện biệt danh, hình đại diện, lớp và số sao – không có họ tên, ảnh hay thông tin liên lạc.</li>
            <li>Bài làm chỉ bố/mẹ đã đăng nhập xem được.</li>
            <li>Bố/mẹ có thể xoá hồ sơ bé bất cứ lúc nào (nút "Xoá" ở trên) – toàn bộ bài làm và sao bị xoá theo.</li>
          </ul>
        </details>
      </div>
    </div>
  );
}
