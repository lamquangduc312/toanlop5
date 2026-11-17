// Kiểm tra dữ liệu đề thi: npm run check
// Đóng gói src/lib/validateData.ts bằng esbuild (có sẵn cùng Vite) rồi chạy bằng Node.
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = mkdtempSync(join(tmpdir(), 'toan5-check-'));
const outfile = join(dir, 'validate.mjs');
let exitCode = 0;

try {
  await build({
    entryPoints: ['src/lib/validateData.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile,
    logLevel: 'error',
  });
  const { validateData } = await import(pathToFileURL(outfile).href);
  const r = validateData();

  console.log(`\n📚 Ngân hàng: ${r.questionCount} câu hỏi · ${r.examCount} đề thi\n`);
  console.log('Chủ đề                                          Số câu   Mã câu mới tiếp theo');
  for (const t of r.perTopic) console.log(`  ${t.topic.padEnd(46)} ${String(t.count).padStart(4)}     ${t.nextId}`);

  if (r.warnings.length) {
    console.log(`\n⚠️  ${r.warnings.length} lưu ý (không chặn):`);
    for (const w of r.warnings) console.log('   - ' + w);
  }
  if (r.errors.length) {
    console.log(`\n❌ ${r.errors.length} LỖI – phải sửa trước khi đưa lên web:`);
    for (const e of r.errors) console.log('   - ' + e);
    exitCode = 1;
  } else {
    console.log('\n✅ Dữ liệu hợp lệ.\n');
  }
} catch (err) {
  console.error('❌ Không đọc được dữ liệu (lỗi cú pháp trong mockData.ts?):\n', err.message ?? err);
  exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}

process.exit(exitCode);
