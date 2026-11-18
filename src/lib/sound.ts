/**
 * Âm thanh thông báo kết quả – tổng hợp bằng Web Audio API (không cần file âm thanh, không tải gì thêm).
 * Bật/tắt bằng nút loa ở đầu trang; lựa chọn được nhớ trên trình duyệt.
 */

const MUTE_KEY = 'toan5-sound-muted';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* trình duyệt chặn lưu – bỏ qua */
  }
}

/** Một nốt: tần số (Hz), bắt đầu sau `at` giây, kéo dài `dur` giây */
interface Note {
  f: number;
  at: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
}

function play(notes: Note[]) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + 0.05;
  const master = ac.createGain();
  master.gain.value = 0.22;
  master.connect(ac.destination);

  for (const n of notes) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = n.type ?? 'triangle';
    osc.frequency.value = n.f;
    const start = t0 + n.at;
    const end = start + n.dur;
    const peak = n.vol ?? 1;
    // Bao âm mềm (không bị "bụp")
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(end + 0.05);
  }
}

// Tần số các nốt (Hz)
const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880, B5 = 987.77, C6 = 1046.5, E6 = 1318.5, G6 = 1568;
const G4 = 392, A4 = 440, B4 = 493.88;

/** Rải hợp âm lấp lánh (tiếng "kim tuyến") */
function sparkle(from: number): Note[] {
  return [C6, E6, G6, E6, G6, C6 * 2].map((f, i) => ({ f, at: from + i * 0.06, dur: 0.18, type: 'sine', vol: 0.45 }));
}

/** Phát âm thanh theo mức điểm (khớp với số sao trên thẻ kết quả) */
export function playResultSound(score10: number) {
  if (score10 >= 9) {
    // 🏆 Kèn chiến thắng: đi lên rồi ngân dài + lấp lánh
    play([
      { f: C5, at: 0, dur: 0.14 },
      { f: E5, at: 0.13, dur: 0.14 },
      { f: G5, at: 0.26, dur: 0.14 },
      { f: C6, at: 0.39, dur: 0.3 },
      { f: G5, at: 0.62, dur: 0.12 },
      { f: C6, at: 0.74, dur: 0.75 },
      { f: E5, at: 0.74, dur: 0.75, vol: 0.5 },
      { f: G5, at: 0.74, dur: 0.75, vol: 0.5 },
      ...sparkle(0.95),
    ]);
  } else if (score10 >= 7) {
    // 🌟 Giai điệu vui tươi
    play([
      { f: G5, at: 0, dur: 0.14 },
      { f: A5, at: 0.13, dur: 0.14 },
      { f: B5, at: 0.26, dur: 0.14 },
      { f: C6, at: 0.39, dur: 0.5 },
      { f: E5, at: 0.39, dur: 0.5, vol: 0.5 },
      ...sparkle(0.55).slice(0, 4),
    ]);
  } else if (score10 >= 5) {
    // 💪 Cổ vũ "cố lên": hai nhịp gõ rồi đi lên
    play([
      { f: E5, at: 0, dur: 0.12 },
      { f: E5, at: 0.16, dur: 0.12 },
      { f: F5, at: 0.32, dur: 0.14 },
      { f: G5, at: 0.48, dur: 0.4 },
    ]);
  } else {
    // 🌱 Nhẹ nhàng, ấm áp – không "buzz" chê bai, kết thúc đi lên để động viên
    play([
      { f: G4, at: 0, dur: 0.22, type: 'sine' },
      { f: A4, at: 0.22, dur: 0.22, type: 'sine' },
      { f: B4, at: 0.44, dur: 0.22, type: 'sine' },
      { f: D5, at: 0.66, dur: 0.5, type: 'sine' },
    ]);
  }
}

/** Tiếng "ting" ngắn khi bật loa (để biết âm thanh đã hoạt động) */
export function playTest() {
  play([
    { f: C6, at: 0, dur: 0.12, type: 'sine', vol: 0.6 },
    { f: E6, at: 0.08, dur: 0.2, type: 'sine', vol: 0.6 },
  ]);
}
