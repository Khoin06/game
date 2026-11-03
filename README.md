# 🏎️ ĐƯỜNG ĐUA TIKTOK LIVE CHIBI (INTERACTIVE RACE GAME)

Hệ thống game tương tác livestream TikTok hoàn chỉnh gồm 2 phần:
1. **Frontend Game Engine** (`index.html`): Chạy trên HTML5 Canvas, Tailwind CSS, Web Audio API Synthesizer, hiệu ứng hạt khói lửa nitro, rào cản, và bảng xếp hạng thời gian thực.
2. **Local Bridge Server** (`server.js`): Node.js + WebSocket + `tiktok-live-connector` để lắng nghe sự kiện Chat, Like, Gift (Hoa hồng, Xe thể thao, v.v.) từ phòng live TikTok và phát trực tiếp vào game.

---

## 📁 Cấu Trúc Dự Án

```text
tiktok-live-race-game/
├── index.html        # Giao diện game cuộn ngang (chơi trực tiếp trên trình duyệt hoặc OBS)
├── server.js         # Bridge kết nối TikTok Live qua WebSocket (Port 8080)
├── package.json      # Danh sách thư viện cần thiết (tiktok-live-connector, ws)
└── README.md         # Hướng dẫn chi tiết
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Game

### Bước 1: Cài đặt Node.js
Nếu máy tính của bạn chưa có Node.js:
- Tải bản **Node.js LTS** tại: [https://nodejs.org/](https://nodejs.org/) (hoặc cài bằng Winget trong PowerShell: `winget install OpenJS.NodeJS.LTS`).

### Bước 2: Cài đặt các gói thư viện
Mở Terminal hoặc PowerShell tại thư mục này (`tiktok-live-race-game`) và chạy:

```bash
npm install
```

Lệnh này sẽ tự động tải 2 thư viện:
- `tiktok-live-connector`: Kết nối và thu thập sự kiện từ TikTok Live.
- `ws`: WebSocket server siêu nhẹ chạy ở cổng 8080.

---

### Bước 3: Khởi chạy Local Bridge Server

Bạn có thể chạy theo 2 cách tùy theo nhu cầu:

#### Cách 1: Kết nối trực tiếp vào phòng TikTok Live thật (Khi bạn hoặc ai đó đang Live)
```bash
node server.js @ten_tai_khoan_tiktok
```
*Ví dụ:* `node server.js @streamer_vietnam` (có thể có hoặc không có chữ `@`).

#### Cách 2: Chạy chế độ Mô Phỏng (Mock Test) khi chưa Live
Nếu bạn muốn thử nghiệm trước hoặc kiểm tra hiệu ứng mà không cần phải bật livestream trên TikTok:
```bash
node server.js --mock
```
*Hệ thống sẽ tự động giả lập các sự kiện chat, like, tặng hoa hồng mỗi 2-3 giây để bạn xem trực tiếp trên màn hình game.*

---

### Bước 4: Mở Game trên Trình Duyệt

Sau khi khởi chạy `server.js`:
1. Mở trình duyệt (Chrome, Cốc Cốc, Edge).
2. Truy cập địa chỉ:
   ```text
   http://localhost:8080
   ```
   *(Hoặc bạn có thể nhấp đúp trực tiếp vào file `index.html` để mở).*
3. Góc trên bên trái sẽ hiện: **🟢 Đã kết nối Local Bridge**.

---

## 🎮 Cách Tương Tác Trong Game

| Hành Động Trên TikTok | Phản Ứng Trong Game |
| :--- | :--- |
| **Vào xem phòng live** | Tự động sinh nhân vật Chibi mang tên người xem |
| **Chat "chay", "run", "boost"** | Nhân vật tăng tốc nhẹ trong 2.5 giây |
| **Chat "nhay", "jump"** | Nhân vật nhảy lên né rào cản |
| **Thả tim (Like)** | Tích điểm tương tác, mỗi 15 tim kích hoạt cú nhảy |
| **Tặng Hoa Hồng 🌹** | **Tăng tốc x2.5** trong 4 giây + Phun lửa nitro |
| **Tặng Tim / Love 💖** | Siêu nhảy vọt qua mọi chướng ngại vật |
| **Tặng Quà Lớn (Xe Thể Thao, Galaxy...) 🏎️** | **Mega Boost x3.5** trong 6 giây + Hóa khổng lồ |

---

## 🌐 HƯỚNG DẪN TRIỂN KHAI LÊN VERCEL (DEPLOY TO VERCEL)

Dự án đã được cấu hình sẵn file `vercel.json` để bạn có thể đưa Game Frontend lên Vercel chỉ trong vài phút.

### ⚠️ Lưu ý quan trọng về kiến trúc:
- **Vercel** là nền tảng hosting Serverless & Static: Rất hoàn hảo để host giao diện game (`index.html`) với đường link HTTPS công khai, tốc độ cao để dán vào OBS Browser Source.
- **TikTok Live Bridge (`server.js`)**: Cần một kết nối WebSocket liên tục (persistent TCP), do đó file này sẽ chạy trên máy tính của bạn (hoặc Render / Railway / VPS) để kết nối vào TikTok Live và phát tín hiệu cho OBS.
- Game trên Vercel đã được thiết kế sẵn:
  - Tự động kết nối tới `ws://localhost:8080` (hoặc URL bạn cấu hình qua nút **🔗 Bridge URL**).
  - Tự động chuyển sang chế độ **Mô Phỏng Tự Động (Auto-Demo)** nếu mở trên web mà chưa bật Local Bridge.

---

### Cách 1: Deploy qua Vercel Dashboard & GitHub (Khuyên dùng - Nhanh nhất)
1. Đẩy thư mục này lên một repository mới trên [GitHub](https://github.com).
2. Đăng nhập vào [Vercel](https://vercel.com).
3. Bấm **Add New...** ➜ **Project** ➜ Chọn repository vừa tạo.
4. Bấm **Deploy**. Vercel sẽ tự động build và cấp cho bạn một đường link miễn phí (ví dụ: `https://tiktok-chibi-race.vercel.app`).

### Cách 2: Deploy qua Vercel CLI
Nếu bạn đã cài Node.js trên máy, mở terminal tại thư mục này và chạy:
```bash
npm install -g vercel
vercel
```
Làm theo các bước hướng dẫn trên màn hình terminal để hoàn tất đăng nhập và xuất bản lên Vercel.

---

## 📺 Đưa Game Lên OBS Studio / TikTok Live Studio

1. Mở **OBS Studio** hoặc **TikTok Live Studio**.
2. Thêm nguồn mới: Chọn **Browser Source** (Trình duyệt).
3. Cài đặt các thông số:
   - **URL**: `http://localhost:8080` (hoặc đường dẫn tới `index.html`)
   - **Width (Chiều rộng)**: `1920` (ngang) hoặc `1080` (dọc màn hình điện thoại)
   - **Height (Chiều cao)**: `1080` (ngang) hoặc `1920` (dọc màn hình điện thoại)
4. Tích chọn **"Shutdown source when not visible"** nếu cần tiết kiệm RAM.

---

## 🛠️ Tính Năng Bảng Test Offline (Tích Hợp Sẵn Trong Game)

Trên góc màn hình game có nút **"⚙️ Bảng Test Offline"**:
- Cho phép bạn bấm nút để test ngay lập tức các hiệu ứng:
  - 👤 *Thêm 1 nhân vật ngẫu nhiên*
  - 🌹 *Test Quà Hoa Hồng (Tăng tốc)*
  - ❤️ *Test Thả Tim (Nhảy)*
  - 💬 *Test Chat*
  - 🏎️ *Test Siêu Xe (Mega Boost)*
- Tích hợp sẵn bộ tổng hợp âm thanh **Web Audio API** (không bị lỗi thiếu file MP3).

