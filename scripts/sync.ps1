# Đồng bộ thư mục dự án với GitHub (lamquangduc312/toanlop5).
# Cách dùng:  npm run sync            → commit với lời nhắn mặc định
#             npm run sync -- "Thêm 10 câu đề cương"
param([string]$Message = "")

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  $env:Path = "C:\Program Files\Git\cmd;" + $env:Path
}

# Chặn tuyệt đối việc đưa cấu hình Firebase lên repo công khai
if (git ls-files --cached -- .env.local) {
  Write-Host 'LỖI: .env.local đang bị theo dõi bởi git – dừng lại để không lộ cấu hình.' -ForegroundColor Red
  exit 1
}

Write-Host '1/3 Lấy thay đổi mới nhất từ GitHub...' -ForegroundColor Cyan
git add -A
if (git status --porcelain) {
  if (-not $Message) { $Message = "Cập nhật $(Get-Date -Format 'dd/MM/yyyy HH:mm')" }
  git commit -m $Message | Out-Null
  Write-Host "    Đã commit: $Message"
}
git pull --rebase origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Không lấy được thay đổi từ GitHub (xung đột hoặc mất mạng) – CHƯA đẩy lên.' -ForegroundColor Red
  exit 1
}

Write-Host '2/3 Kiểm tra build (tránh đẩy code lỗi làm hỏng web trên Vercel)...' -ForegroundColor Cyan
npm run build --silent
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Build lỗi – CHƯA đẩy lên GitHub. Sửa lỗi rồi chạy lại.' -ForegroundColor Red
  exit 1
}

Write-Host '3/3 Đẩy lên GitHub...' -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Đẩy lên GitHub THẤT BẠI (chưa đăng nhập GitHub hoặc mất mạng). Commit vẫn nằm trên máy, chạy lại npm run sync sau.' -ForegroundColor Red
  exit 1
}
Write-Host 'Xong! Vercel sẽ tự triển khai bản mới sau khoảng 1 phút.' -ForegroundColor Green
