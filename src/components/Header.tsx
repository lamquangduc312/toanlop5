import { BarChart3, BookOpen, Cloud, CloudOff, GraduationCap, Timer } from 'lucide-react';
import { STUDENT } from '../mockData';

export type Tab = 'topics' | 'exams' | 'stats';

interface Props {
  tab: Tab;
  onTab: (t: Tab) => void;
  showNav: boolean;
  dataSource: 'firebase' | 'local';
}

const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'topics', label: 'Học theo chủ đề', icon: BookOpen },
  { id: 'exams', label: 'Làm đề 40 phút', icon: Timer },
  { id: 'stats', label: 'Thống kê', icon: BarChart3 },
];

export default function Header({ tab, onTab, showNav, dataSource }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 text-white">
            <GraduationCap className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-extrabold text-slate-800">Toán 5 cùng Hà Ngân</p>
            <p className="text-xs text-slate-500">
              {STUDENT.name} · Lớp {STUDENT.className} · {STUDENT.school}
            </p>
          </div>
        </div>

        <span
          className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            dataSource === 'firebase' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
          title={dataSource === 'firebase' ? 'Kết quả được lưu trên Firebase' : 'Chưa kết nối Firebase – kết quả lưu trên trình duyệt này'}
        >
          {dataSource === 'firebase' ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
          {dataSource === 'firebase' ? 'Firebase' : 'Lưu trên máy'}
        </span>

        {showNav && (
          <nav className="flex w-full gap-1 rounded-xl bg-slate-100 p-1 sm:w-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTab(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition sm:flex-none ${
                  tab === id ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
