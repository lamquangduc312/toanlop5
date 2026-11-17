# Kịch bản thêm đề thi mới

Có 2 cách. **Cách 1 (nhờ Claude)** nhanh và an toàn nhất. **Cách 2 (tự thêm)** dùng khi muốn sửa nhỏ hoặc thêm vài câu.

---

## Cách 1 – Nhờ Claude (khuyên dùng)

### Bước 1. Cất file đề
Chép file đề (Word `.docx`/`.doc`, PDF, hoặc ảnh chụp đề) vào thư mục:

```
E:\HA NGAN\Toan_Lop5\De_moi\
```

> Nên chọn file **có đáp án / hướng dẫn giải**. Nếu chỉ có đề, Claude sẽ tự giải và ghi rõ "Claude tự giải".

### Bước 2. Mở Claude trong thư mục `E:\HA NGAN\Toan_Lop5\toan5-ha-ngan` và gửi câu lệnh mẫu

```
Thêm đề mới từ file E:\HA NGAN\Toan_Lop5\De_moi\<tên file>
Tên đề: <ví dụ: TH Đại Kim – Giữa kì I 2026–2027>
Loại: đề trường   (hoặc: đề luyện sách)
Làm theo kịch bản docs/THEM-DE-MOI.md
```

Muốn thêm câu vào ngân hàng **mà không tạo đề riêng** (ví dụ đề cương cô giao), viết:
`Chỉ thêm câu hỏi vào các chủ đề, không tạo đề mới.`

### Bước 3. Claude sẽ tự làm
1. Đọc từng câu trong file, xếp vào đúng 1 trong 8 chủ đề.
2. Viết câu hỏi + hướng dẫn giải; **tự tính lại từng đáp án** và báo câu nào trong file gốc in sai.
3. Ghép thành đề 40 phút, chạy `npm run check` (kiểm tra dữ liệu) và mở thử trên trình duyệt.
4. Chạy `npm run sync` để đẩy lên GitHub → web **https://chuyentoanlop5.vercel.app/** tự cập nhật sau ~1 phút.
5. Báo lại: số câu đã thêm, câu bị bỏ (và lý do), lỗi đáp án gốc đã sửa.

### Bước 4. Bạn kiểm tra lại
Mở link web → tab **Làm đề 40 phút** → đề mới nằm ở nhóm 🏫 *Đề thi thật của các trường* (hoặc 📘 *Đề luyện sách*). Làm thử 1–2 câu.

---

## Cách 2 – Tự thêm bằng tay

Toàn bộ câu hỏi và đề nằm trong **một file**: `src/mockData.ts`.

### Bước 1. Xem mã câu tiếp theo
Mở Terminal trong thư mục `toan5-ha-ngan`, chạy:

```bash
npm.cmd run check
```

Bảng kết quả cho biết **mã câu mới tiếp theo** của mỗi chủ đề (ví dụ `dt33`, `lv32`).

### Bước 2. Thêm câu hỏi vào mảng `QUESTIONS`
Tìm đúng khu vực chủ đề (có dòng chú thích `// ===== ... =====`) và thêm dòng theo mẫu:

| Chủ đề | Dùng | Mã bắt đầu bằng |
|---|---|---|
| 🔢 Đọc, viết & cấu tạo số thập phân | `DV` | `dv` |
| ⚖️ So sánh & sắp xếp | `SS` | `ss` |
| 🎯 Làm tròn | `LT` | `lt` |
| 🍕 Phân số thập phân & hỗn số | `PS` | `ps` |
| 📏 Đổi đơn vị (khối lượng, độ dài, thời gian) | `DD` | `dd` |
| 🗺️ Diện tích, ha, km² | `DT` | `dt` |
| 🧮 Tính toán & tính nhanh | `TT` | `tt` |
| 📖 Toán có lời văn | `LV` | `lv` |

**Câu trắc nghiệm** – đáp án đúng ghi bằng số: `0` = A, `1` = B, `2` = C, `3` = D

```ts
DT.mc('dt33', 'Số đo nào lớn nhất?', ['3 ha', '29 000 m²', '0,02 km²', '2 ha 900 m²'], 0,
  'Đổi ra m²: 3 ha = 30 000 m²; 0,02 km² = 20 000 m²; 2 ha 900 m² = 20 900 m² → 3 ha lớn nhất.', 'TH Đại Kim – GK1 2026'),
```

**Câu điền đáp án** – thứ tự: mã, đề bài, đáp án, hướng dẫn giải, nguồn, đơn vị (nếu có)

```ts
DT.input('dt34', '4 ha 25 m² = … m²', '40025', '4 ha = 40 000 m² → 40 000 + 25 = 40 025 m².', 'TH Đại Kim – GK1 2026', 'm²'),
```

**Toán có lời văn** (mặc định 2 điểm) – dùng `\n` để xuống dòng trong lời giải

```ts
LV.input('lv32', 'Một thửa ruộng hình chữ nhật dài 120 m, rộng 80 m … Hỏi thu được bao nhiêu tạ thóc?', '48',
  'Diện tích: 120 × 80 = 9 600 (m²) = 0,96 ha\nSố thóc: 0,96 × 50 = 48 (tạ).', 'TH Đại Kim – GK1 2026', 'tạ'),
```

Quy tắc viết đáp án:
- Số thập phân dùng **dấu phẩy**: `'0,75'` (không viết `0.75`).
- Số lớn viết liền hoặc có dấu cách đều được: `'16850000'` hoặc `'16 850 000'`.
- Phân số viết `'3/4'`, hỗn số viết `'3 1/4'`.
- Nhiều cách viết đều đúng thì ghi dạng danh sách: `['XIX', '19']`.
- Muốn đổi điểm của câu: thêm số điểm ở cuối, ví dụ `..., 'm²', 1.5)`.

### Bước 3. Tạo đề trong mảng `EXAMS` (cuối file)

```ts
exam('dai-kim-gk1-2026', 'TH Đại Kim – Giữa kì I', 'Đề GK1 2026 – 2027',
  ['dt33', 'dt34', 'lv32', /* … mã các câu theo đúng thứ tự trong đề … */]),
```

- Mã đề (`'dai-kim-gk1-2026'`): chữ thường **không dấu**, số, dấu gạch ngang; không trùng đề khác.
- Dòng thứ 3 (nguồn) có chữ `KNTT` → đề nằm nhóm 📘 *Đề luyện sách*; không có → nhóm 🏫 *Đề thi thật của các trường*.
- Có thể dùng lại câu đã có sẵn (ví dụ `'dv3'`) nếu đề mới trùng câu cũ.

### Bước 4. Kiểm tra rồi đưa lên web

```bash
npm.cmd run check
```
Hết dòng ❌ LỖI thì chạy:

```bash
npm.cmd run sync -- "Thêm đề TH Đại Kim GK1"
```

Lệnh `sync` tự kiểm tra lại dữ liệu + build; **có lỗi sẽ dừng, không làm hỏng web**.

---

## Lưu ý chung
- **Câu có hình vẽ** (đếm góc, đồng hồ, hình tô màu…): hiện web chưa hiển thị ảnh → mô tả hình bằng lời trong đề bài, hoặc bỏ câu đó.
- **Đáp án gốc có thể in sai** (6 đề trong bộ hiện tại đã có lỗi) → luôn tự tính lại trước khi nhập.
- **Không xoá hoặc đổi mã câu cũ**: thống kê của bé gắn với mã câu; đổi mã sẽ mất lịch sử câu đó.
- Bài làm cũ của bé không bị ảnh hưởng khi thêm đề mới.
