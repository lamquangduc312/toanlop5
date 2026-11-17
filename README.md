# Toán 5 cùng Hà Ngân

Web app ôn thi giữa kì I Toán lớp 5 cho bé **Lâm Hà Ngân – lớp 5A7, Trường Tiểu học Đại Kim**.

👉 **Vào học tại: https://chuyentoanlop5.vercel.app/**

- **Học theo chủ đề** (8 chủ đề): mỗi lượt 10 câu, chấm ngay từng câu, có hướng dẫn giải; câu sai lần trước được hỏi lại trước.
- **Làm cả đề 40 phút**: 13 đề lấy từ tài liệu và 1 đề ngẫu nhiên. Có đồng hồ đếm ngược, hết giờ tự nộp, điểm quy về thang 10.
- **Thống kê**: số lượt làm, điểm trung bình, mức thành thạo từng chủ đề, gợi ý chủ đề cần ôn, ôn lại các câu còn sai.
- **Lưu kết quả** lên Firebase Firestore (collection `attempts`). Chưa cấu hình hoặc mất mạng thì lưu tạm vào trình duyệt và tự đồng bộ lần sau.

## Chạy ngay

```bash
cd toan5-ha-ngan
npm install
npm run dev
```

## Kết nối Firebase (tuỳ chọn)

1. Vào https://console.firebase.google.com → tạo project → **Build › Firestore Database** → Create database.
2. **Project settings › Your apps › Web** → đăng ký app → chép cấu hình.
3. Sao chép `.env.example` thành `.env.local` và điền các giá trị `VITE_FIREBASE_*`.
4. Dán nội dung `firestore.rules` vào tab **Rules** của Firestore → Publish.
5. Chạy lại `npm run dev`. Góc phải phía trên sẽ hiện **Firebase** thay vì **Lưu trên máy**.

## Cấu trúc

```
src/
  types.ts            Kiểu dữ liệu (Topic, Question, Exam, Attempt, Stats…)
  mockData.ts         8 chủ đề, ngân hàng câu hỏi và 13 đề (đã sửa lỗi đáp án gốc)
  App.tsx             Điều hướng màn hình, lưu và tải kết quả
  lib/
    firebase.ts       Khởi tạo Firestore từ biến môi trường
    storage.ts        Lưu / đọc bài làm (Firebase, dự phòng localStorage)
    grading.ts        Chấm điểm (hiểu số kiểu Việt Nam: 0,75; 16 850 000)
    stats.ts          Tính thống kê, chủ đề yếu, câu cần ôn lại
    session.ts        Tạo lượt luyện chủ đề / đề thi / đề ngẫu nhiên / ôn câu sai
  components/
    Header, TopicList, ExamList, TopicPractice, ExamRunner,
    QuestionCard, Timer, ResultView, StatsDashboard, ProgressBar, TopicIcon
```

## Thêm đề thi / câu hỏi mới

👉 Xem kịch bản chi tiết: **[docs/THEM-DE-MOI.md](docs/THEM-DE-MOI.md)**

Tóm tắt:
- `npm.cmd run check`: kiểm tra dữ liệu và cho biết mã câu mới tiếp theo của từng chủ đề.
- `npm.cmd run sync -- "lời nhắn"`: kiểm tra, build rồi đẩy lên GitHub. Vercel tự cập nhật web.
