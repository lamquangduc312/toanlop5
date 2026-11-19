# Chuyên Toán lớp 5 – hướng dẫn cho Claude

Web app luyện Toán lớp 5 (ban đầu cho bé Lâm Hà Ngân 5A7, TH Đại Kim; nay mở cho nhiều bé). React 18 + TS + Tailwind + Vite, lưu kết quả Firestore.
Live: https://chuyentoanlop5.vercel.app/ (Vercel tự build từ GitHub `lamquangduc312/toanlop5`, nhánh `main`).
Người dùng là phụ huynh, giao tiếp bằng **tiếng Việt**.

## Quy tắc bắt buộc
- Sau MỌI thay đổi: `npm.cmd run sync -- "<lời nhắn tiếng Việt>"` (check dữ liệu → build → push). Báo lại mã commit.
- Nếu `git` không có trong PATH: thêm `C:\Program Files\Git\cmd`. PowerShell chặn npm.ps1 → luôn gọi `npm.cmd`.
- Không bao giờ commit `.env.local` (repo public).
- Không đổi/xoá mã câu hỏi đã có – thống kê `attempts` trên Firestore gắn với mã câu.

## Kịch bản: thêm đề thi mới (người dùng nói "thêm đề mới từ file …")
Chi tiết cho người dùng: `docs/THEM-DE-MOI.md`. Các bước của Claude:

1. **Đọc file đề** (thường trong `E:\HA NGAN\Toan_Lop5\De_moi\`). `.docx`: giải nén `word/document.xml` (phân số/công thức thường là ảnh hoặc OMML → suy ra từ lời giải, ghi "Theo dạng…" nếu phải tự dựng số liệu). `.doc`: chuyển bằng Word COM. Đọc TOÀN BỘ, kể cả đáp án.
2. **Xếp chủ đề** cho từng câu (8 chủ đề trong `TOPICS`). Chạy `npm.cmd run check` để lấy **mã câu tiếp theo** của mỗi chủ đề.
3. **Viết câu hỏi** vào `QUESTIONS` trong `src/mockData.ts`, đặt trong đúng khu vực chủ đề, dùng factory `DV/SS/LT/PS/DD/DT/TT/LV` `.mc(...)` / `.input(...)`:
   - `mc(id, prompt, options, answerIndex, explanation, source, points?)`
   - `input(id, prompt, answers, explanation, source, unit?, points?)` – số thập phân dùng dấu phẩy.
   - Điểm mặc định: mc 0,5 · input 1 · loi-van 2; chỉnh `points` cho khớp đề gốc nếu cần.
   - **Tự tính lại mọi đáp án**; nếu đáp án gốc sai → dùng đáp án đúng và ghi "(Đã sửa đáp án: …)" trong explanation.
   - Câu phụ thuộc hình vẽ không mô tả được bằng lời → bỏ, liệt kê trong báo cáo.
   - Câu đã có sẵn trong ngân hàng → dùng lại mã cũ, không tạo trùng.
4. **Tạo đề** trong `EXAMS`: `exam('<ma-de-khong-dau>', '<Tên>', '<Nguồn>', [ids theo thứ tự đề])`. Nguồn có "KNTT" → nhóm Đề luyện sách; không có → nhóm Đề trường.
5. `npm.cmd run check` phải ✅. Mở dev server (`preview_start toan5-dev`), vào tab Làm đề, mở đề mới, xem vài câu hiển thị đúng (không nộp bài – tránh ghi dữ liệu thử lên Firestore).
6. `npm.cmd run sync -- "Thêm đề <tên>"` → đợi ~60 s, xác nhận link live có đề mới.
7. Báo cáo ngắn bằng tiếng Việt: số câu thêm theo chủ đề, câu bị bỏ + lý do, lỗi đáp án gốc đã sửa, mã commit.

## Đăng nhập, hồ sơ bé, sao, xếp hạng
- Không bắt buộc đăng nhập: khách học bình thường, bài lưu localStorage (không có `ownerUid`); khi đăng nhập có banner chuyển bài vào hồ sơ bé.
- Phụ huynh đăng nhập Google (Firebase Auth, popup → fallback redirect; Zalo/Facebook bị Google chặn → hướng dẫn mở Chrome/Safari).
- `children/{id}`: hồ sơ bé, đọc công khai cho bảng xếp hạng → CHỈ biệt danh, avatar, lớp, trường, sao. `attempts` có `ownerUid` + `studentId` = mã bé.
- Hồ sơ cũ `lam-ha-ngan-5a7` thuộc `lamquangduc312@gmail.com`: `claimLegacy()` tự tạo hồ sơ "Ngân 🐼" và gắn `ownerUid` cho bài cũ khi tài khoản này đăng nhập.
- Sao tính lại từ toàn bộ lịch sử (`src/lib/stars.ts`), ghi `totalStars` + `weeks.wYYYY_WW` lên hồ sơ. Bảng xếp hạng dùng chỉ mục một trường tự động – không cần tạo index.
- Quy tắc bảo mật: `firestore.rules` (dán vào Console → Firestore → Rules → Publish khi sửa).

## Cấu trúc nhanh
- `src/mockData.ts` – TOPICS, QUESTIONS, EXAMS (dữ liệu duy nhất cần sửa khi thêm đề).
- `src/lib/validateData.ts` + `scripts/check-data.mjs` – `npm run check`.
- `src/lib/grading.ts` – chấm điểm (hiểu số kiểu VN). `stats.ts` – thống kê. `storage.ts` – Firestore + fallback localStorage.
- `scripts/sync.ps1` – `npm run sync`.
