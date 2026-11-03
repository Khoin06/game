@echo off
chcp 65001 >nul
title TikTok Live Bridge - @dyhfvz06vn73
echo ========================================================
echo   🎮 TIKTOK LIVE CHIBI RACE - KẾT NỐI: @dyhfvz06vn73
echo ========================================================
echo.
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Máy tính chưa nhận diện được lệnh Node.js!
    echo 👉 Vui lòng tải và cài đặt Node.js từ: https://nodejs.org
    echo.
    pause
    exit /b
)

if not exist node_modules (
    echo 📦 Đang cài đặt thư viện cần thiết lần đầu...
    npm install
)

echo.
echo 📡 Đang kết nối tới phòng TikTok Live @dyhfvz06vn73...
echo 💡 Hãy chắc chắn rằng tài khoản @dyhfvz06vn73 ĐANG BẬT LIVESTREAM!
echo.
node server.js dyhfvz06vn73
pause
