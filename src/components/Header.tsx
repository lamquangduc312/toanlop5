import { CloudOff, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { useLearner } from '../lib/account';
import { isMuted, playTest, setMuted } from '../lib/sound';
import type { DataSource } from '../lib/storage';

export type Tab = 'topics' | 'exams' | 'stats' | 'rank';

interface Props {
  tab: Tab;
  onTab: (t: Tab) => void;
  showNav: boolean;
  dataSource: DataSource;
}

const TABS: { id: Tab; label: string; short: string; emoji: string; active: string }[] = [
  { id: 'topics', label: 'Học theo chủ đề', short: 'Chủ đề', emoji: '📚', active: 'bg-pink-500 border-pink-700 text-white' },
  { id: 'exams', label: 'Làm đề 40 phút', short: 'Làm đề', emoji: '⏱️', active: 'bg-indigo-500 border-indigo-700 text-white' },
  { id: 'stats', label: 'Thống kê', short: 'Tiến bộ', emoji: '📊', active: 'bg-emerald-500 border-emerald-700 text-white' },
  { id: 'rank', label: 'Xếp hạng', short: 'Xếp hạng', emoji: '🏆', active: 'bg-amber-400 border-amber-600 text-white' },
];

export default function Header({ tab, onTab, showNav, dataSource }: Props) {
  const { child, stars, loggedIn, openAccount } = useLearner();
  const [muted, setMutedState] = useState(isMuted);
  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) playTest();
  };

  return (
    <header className="sticky top-0 z-20 border-b-2 border-orange-100 bg-white/90 backdrop-blur">
      <div className="h-1.5 bg-[linear-gradient(90deg,#f472b6,#fb923c,#facc15,#34d399,#38bdf8,#a78bfa)]" />
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-3">
        <div className="flex min-w-0 flex-1 basis-0 items-center gap-2 sm:gap-3 lg:flex-none lg:basis-auto">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border-b-4 border-pink-700 bg-gradient-to-br from-orange-400 to-pink-500 font-display text-2xl sm:text-3xl font-extrabold text-white shadow-sm sm:h-12 sm:w-12">
            5
          </span>
          <div className="min-w-0 leading-tight">
            <p className="whitespace-nowrap font-display text-lg font-extrabold leading-none text-slate-800 sm:text-2xl">
              Chuyên Toán <span className="text-pink-500">lớp 5</span>
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {child ? `Đang học: ${child.nickname} · Lớp ${child.className}` : 'Học ngay – không cần đăng nhập'}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:order-last lg:ml-0">
          {/* Chỉ báo khi KHÔNG lưu được online (để phụ huynh biết mà kiểm tra) */}
          {dataSource === 'local' && (
            <span className="chip bg-amber-100 text-amber-800" title="Không kết nối được mạng – kết quả lưu tạm trên trình duyệt này">
              <CloudOff className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Lưu trên máy</span>
            </span>
          )}

          <button
            onClick={openAccount}
            className={`btn px-2 py-1 text-sm sm:px-2.5 sm:py-1.5 sm:text-base ${loggedIn && child ? 'btn-white' : 'border-amber-600 bg-amber-400 text-white'}`}
            title={loggedIn ? 'Tài khoản & hồ sơ bé' : 'Đăng nhập để tích sao'}
          >
            {loggedIn && child ? (
              <>
                <span className="text-xl leading-none">{child.avatar}</span>
                <span className="font-display font-extrabold text-amber-500">⭐ {stars.total}</span>
              </>
            ) : (
              <>
                ⭐ {loggedIn ? 'Tạo hồ sơ' : 'Lưu sao'}
              </>
            )}
          </button>

          <button
            onClick={toggleSound}
            className="btn btn-white px-1.5 py-1 sm:px-2.5 sm:py-2"
            title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            aria-pressed={!muted}
          >
            {muted ? <VolumeX className="h-5 w-5 text-slate-400" /> : <Volume2 className="h-5 w-5 text-pink-500" />}
          </button>
        </div>

        {showNav && (
          <nav className="flex w-full gap-1.5 sm:gap-2 lg:ml-auto lg:w-auto">
            {TABS.map(({ id, label, short, emoji, active }) => (
              <button
                key={id}
                onClick={() => onTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`btn flex-1 flex-col gap-0 px-1 py-1.5 text-xs sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-base lg:flex-none ${tab === id ? active : 'btn-white'}`}
              >
                <span aria-hidden className="text-lg sm:text-base">
                  {emoji}
                </span>
                <span title={label}>{short}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
