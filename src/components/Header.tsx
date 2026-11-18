import { CloudOff } from 'lucide-react';
import { STUDENT } from '../mockData';

export type Tab = 'topics' | 'exams' | 'stats';

interface Props {
  tab: Tab;
  onTab: (t: Tab) => void;
  showNav: boolean;
  dataSource: 'firebase' | 'local';
}

const TABS: { id: Tab; label: string; short: string; emoji: string; active: string }[] = [
  { id: 'topics', label: 'Học theo chủ đề', short: 'Chủ đề', emoji: '📚', active: 'bg-pink-500 border-pink-700 text-white' },
  { id: 'exams', label: 'Làm đề 40 phút', short: 'Làm đề', emoji: '⏱️', active: 'bg-indigo-500 border-indigo-700 text-white' },
  { id: 'stats', label: 'Thống kê', short: 'Thống kê', emoji: '📊', active: 'bg-emerald-500 border-emerald-700 text-white' },
];

export default function Header({ tab, onTab, showNav, dataSource }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-orange-100 bg-white/90 backdrop-blur">
      <div className="h-1.5 bg-[linear-gradient(90deg,#f472b6,#fb923c,#facc15,#34d399,#38bdf8,#a78bfa)]" />
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border-b-4 border-pink-700 bg-gradient-to-br from-orange-400 to-pink-500 font-display text-3xl font-extrabold text-white shadow-sm">
            5
          </span>
          <div className="leading-tight">
            <p className="font-display text-2xl font-extrabold leading-none text-slate-800">
              Toán 5 cùng <span className="text-pink-500">Hà Ngân</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {STUDENT.name} · Lớp {STUDENT.className} · {STUDENT.school}
            </p>
          </div>
        </div>

        {/* Chỉ báo khi KHÔNG lưu được online (để phụ huynh biết mà kiểm tra) */}
        {dataSource === 'local' && (
          <span className="chip ml-auto bg-amber-100 text-amber-800" title="Chưa kết nối Firebase – kết quả lưu trên trình duyệt này">
            <CloudOff className="h-3.5 w-3.5" /> Lưu trên máy
          </span>
        )}

        {showNav && (
          <nav className={`flex w-full gap-2 sm:w-auto ${dataSource === 'local' ? '' : 'sm:ml-auto'}`}>
            {TABS.map(({ id, label, short, emoji, active }) => (
              <button
                key={id}
                onClick={() => onTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`btn flex-1 px-3 py-2 text-base sm:flex-none ${tab === id ? active : 'btn-white'}`}
              >
                <span aria-hidden>{emoji}</span>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
