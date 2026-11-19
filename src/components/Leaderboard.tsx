import { Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useLearner } from '../lib/account';
import { loadClassmates, loadTop, rankOf, starsOf, type Child, type RankKind } from '../lib/children';
import { isFirebaseConfigured } from '../lib/firebase';
import { BADGES, DAILY_CAP, STAR_RULES, weekKey } from '../lib/stars';

type View = 'week' | 'total' | 'class';

const VIEWS: { id: View; label: string }[] = [
  { id: 'week', label: '📅 Tuần này' },
  { id: 'total', label: '🏆 Tổng sao' },
  { id: 'class', label: '🏫 Lớp của bé' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { child, stars, loggedIn, openAccount, name } = useLearner();
  const [view, setView] = useState<View>('week');
  const [classKind, setClassKind] = useState<RankKind>('week');
  const [rows, setRows] = useState<Child[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const kind: RankKind = view === 'class' ? classKind : view;

  const load = useCallback(async () => {
    if (!isFirebaseConfigured) return;
    setLoading(true);
    setError(false);
    try {
      if (view === 'class') {
        const list = child ? await loadClassmates(child.classKey) : [];
        setRows(list.filter((c) => starsOf(c, kind) > 0).sort((a, b) => starsOf(b, kind) - starsOf(a, kind)));
        setMyRank(null);
      } else {
        setRows(await loadTop(view));
        setMyRank(child ? await rankOf(view, starsOf(child, view)) : null);
      }
    } catch (err) {
      console.error('[Leaderboard]', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [view, kind, child]);

  useEffect(() => {
    void load();
  }, [load]);

  const myStars = child ? starsOf(child, kind) : 0;
  const inList = child ? rows.some((r) => r.id === child.id) : false;

  return (
    <section className="space-y-6">
      <div className="card relative overflow-hidden bg-gradient-to-br from-amber-100 via-yellow-50 to-pink-100 p-6">
        <span className="pointer-events-none absolute -right-1 -top-2 text-7xl animate-floaty sm:text-8xl" aria-hidden>
          🏆
        </span>
        <h1 className="pr-20 text-3xl font-extrabold text-slate-800 sm:text-4xl">Bảng xếp hạng</h1>
        <p className="mt-1 max-w-xl pr-16 text-slate-600">Học đều mỗi ngày để tích thật nhiều sao nhé! Bảng tuần bắt đầu lại vào sáng thứ Hai.</p>
        {loggedIn && child ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip bg-white px-3 py-1 text-sm text-amber-600">
              {child.avatar} {name}: ⭐ {stars.total} sao
            </span>
            <span className="chip bg-white px-3 py-1 text-sm text-pink-600">📅 Tuần này: {stars.weeks[weekKey(Date.now())] ?? 0}</span>
            {stars.streak > 0 && <span className="chip bg-white px-3 py-1 text-sm text-orange-600">🔥 {stars.streak} ngày liên tiếp</span>}
          </div>
        ) : (
          <button onClick={openAccount} className="btn btn-pink mt-4">
            ⭐ Đăng nhập để tích sao & lên bảng
          </button>
        )}
      </div>

      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`btn px-3 py-1.5 text-sm ${view === v.id ? 'border-amber-600 bg-amber-400 text-white' : 'btn-white'}`}
            >
              {v.label}
            </button>
          ))}
          <button onClick={load} disabled={loading} className="ml-auto grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Tải lại">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5 text-slate-500" />}
          </button>
        </div>

        {view === 'class' && child && (
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
            <span>
              Lớp {child.className}
              {child.school ? ` · ${child.school}` : ''}:
            </span>
            {(['week', 'total'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setClassKind(k)}
                className={`rounded-full px-3 py-1 font-semibold ${classKind === k ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {k === 'week' ? 'Tuần này' : 'Tổng'}
              </button>
            ))}
          </div>
        )}

        {view === 'class' && !child ? (
          <p className="py-6 text-center text-slate-500">Đăng nhập và tạo hồ sơ bé để xem bảng xếp hạng của lớp.</p>
        ) : error ? (
          <p className="py-6 text-center text-slate-500">Chưa tải được bảng xếp hạng – kiểm tra mạng rồi bấm ↻.</p>
        ) : !loading && rows.length === 0 ? (
          <p className="py-6 text-center text-slate-500">
            {view === 'week' ? 'Tuần này chưa có bạn nào có sao. Hãy là người đầu tiên! 🚀' : 'Chưa có dữ liệu.'}
          </p>
        ) : (
          <ol className="space-y-2">
            {rows.map((r, i) => {
              const me = r.id === child?.id;
              return (
                <li
                  key={r.id}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2 ${me ? 'border-pink-300 bg-pink-50' : i < 3 ? 'border-amber-200 bg-amber-50/60' : 'border-slate-100'}`}
                >
                  <span className="w-8 text-center font-display text-xl font-extrabold text-slate-500">{MEDALS[i] ?? i + 1}</span>
                  <span className="text-3xl" aria-hidden>
                    {r.avatar}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-bold text-slate-800">
                      {r.nickname} {me && <span className="text-sm text-pink-500">(bé)</span>}
                    </span>
                    <span className="block text-xs text-slate-500">
                      Lớp {r.className}
                      {r.streak >= 3 ? ` · 🔥 ${r.streak} ngày` : ''}
                    </span>
                  </span>
                  <span className="font-display text-xl font-extrabold text-amber-500">⭐ {starsOf(r, kind)}</span>
                </li>
              );
            })}
          </ol>
        )}

        {child && view !== 'class' && !inList && myStars > 0 && myRank && (
          <p className="mt-3 rounded-2xl bg-pink-50 px-3 py-2 text-center text-sm text-pink-700">
            {child.avatar} {child.nickname} đang đứng <b>hạng {myRank}</b> với ⭐ {myStars} sao – cố lên nào!
          </p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-2xl font-bold text-slate-800">⭐ Cách nhận sao</h2>
          <ul className="space-y-2 text-sm">
            {STAR_RULES.map((r) => (
              <li key={r.text} className="flex items-start gap-2">
                <span className="text-xl" aria-hidden>
                  {r.emoji}
                </span>
                <span className="flex-1 text-slate-700">{r.text}</span>
                <span className="shrink-0 font-display font-bold text-amber-500">{r.stars}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Tối đa {DAILY_CAP} sao mỗi ngày (không tính thưởng chuỗi ngày) – học đều quan trọng hơn học dồn!</p>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-2xl font-bold text-slate-800">🎖️ Huy hiệu</h2>
          <div className="grid grid-cols-2 gap-2">
            {BADGES.map((b) => {
              const got = stars.badges.includes(b.id);
              return (
                <div key={b.id} className={`rounded-2xl border-2 p-2 ${got ? 'border-amber-300 bg-amber-50' : 'border-slate-100 opacity-50 grayscale'}`}>
                  <p className="font-display text-base font-bold text-slate-800">
                    {b.emoji} {b.label}
                  </p>
                  <p className="text-xs text-slate-500">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
