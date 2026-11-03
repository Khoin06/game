/**
 * TIKTOK LIVE INTERACTIVE CHIBI RACE - LOCAL BRIDGE SERVER
 * -------------------------------------------------------------
 * Chức năng:
 * 1. Khởi tạo HTTP & WebSocket Server tại cổng 8080 (phục vụ cả game và truyền dữ liệu real-time).
 * 2. Kết nối tới TikTok Live Stream qua tiktok-live-connector.
 * 3. Bắt các sự kiện: Chat, Like (Thả tim), Gift (Tặng quà), Member Join (Vào xem).
 * 4. Chuẩn hóa dữ liệu và phát (broadcast) tới game client qua WebSocket.
 * 5. Tích hợp sẵn chế độ Mock/Mô phỏng (--mock) để kiểm tra game mà không cần đang livestream.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Cổng chạy server
const PORT = process.env.PORT || 8080;

// Đọc tham số dòng lệnh
const args = process.argv.slice(2);
const isMockMode = args.includes('--mock') || args.includes('-m');
let targetUsername = args.find(arg => !arg.startsWith('-')) || process.env.TIKTOK_USERNAME || '';

// Chuẩn hóa username (bỏ dấu @ nếu có)
if (targetUsername.startsWith('@')) {
    targetUsername = targetUsername.substring(1);
}

// 1. KHỞI TẠO HTTP SERVER (Phục vụ file index.html)
const server = http.createServer((req, res) => {
    // Đường dẫn tới index.html
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    // Kiểm tra file tồn tại
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Không tìm thấy file!');
            } else {
                res.writeHead(500);
                res.end(`Lỗi máy chủ: ${err.code}`);
            }
        } else {
            let ext = path.extname(filePath).toLowerCase();
            let contentType = 'text/html; charset=utf-8';
            if (ext === '.js') contentType = 'text/javascript';
            if (ext === '.css') contentType = 'text/css';
            if (ext === '.json') contentType = 'application/json';
            if (ext === '.png') contentType = 'image/png';
            if (ext === '.jpg') contentType = 'image/jpeg';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// 2. KHỞI TẠO WEBSOCKET SERVER
const wss = new WebSocket.Server({ server });

console.log('====================================================');
console.log('🎮 TIKTOK LIVE CHIBI RACE - LOCAL BRIDGE SERVER');
console.log('====================================================');

// Hàm phát dữ liệu cho tất cả client (game index.html)
function broadcast(eventType, user, data = {}) {
    const payload = JSON.stringify({
        type: eventType,
        user: {
            uniqueId: user.uniqueId,
            nickname: user.nickname || user.uniqueId,
            avatar: user.profilePictureUrl || user.avatar || ''
        },
        data: data,
        timestamp: Date.now()
    });

    let clientCount = 0;
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
            clientCount++;
        }
    });

    return clientCount;
}

// Quản lý kết nối WebSocket từ trình duyệt
wss.on('connection', (ws, req) => {
    console.log(`[WebSocket] Game client đã kết nối! IP: ${req.socket.remoteAddress}`);

    // Gửi gói tin chào mừng kèm trạng thái kết nối TikTok
    ws.send(JSON.stringify({
        type: 'system',
        data: {
            message: 'Đã kết nối thành công tới Local Bridge Server!',
            targetUsername: targetUsername || '(Chưa cấu hình)',
            isMockMode: isMockMode
        }
    }));

    ws.on('close', () => {
        console.log('[WebSocket] Game client đã ngắt kết nối.');
    });

    // Cho phép client gửi lệnh test ngược lại server nếu muốn
    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message);
            if (parsed.type === 'test_broadcast') {
                broadcast(parsed.event, parsed.user, parsed.data);
            }
        } catch (e) {
            console.error('[WebSocket] Lỗi xử lý message từ client:', e);
        }
    });
});

// 3. KẾT NỐI TIKTOK LIVE HOẶC CHẠY CHẾ ĐỘ MÔ PHỎNG (MOCK)
if (isMockMode || !targetUsername) {
    if (!targetUsername && !isMockMode) {
        console.log('⚠️ Không tìm thấy TikTok username trong lệnh gọi.');
        console.log('👉 Tự động chuyển sang chế độ MÔ PHỎNG (Mock Mode) để bạn test game ngay lập tức!');
        console.log('👉 Cách kết nối live thật: node server.js @username_cua_ban');
    } else {
        console.log('🤖 Chế độ MÔ PHỎNG (Mock Mode) đang BẬT.');
    }
    startMockSimulation();
} else {
    connectToTikTokLive(targetUsername);
}

/**
 * Hàm kết nối với TikTok Live thật bằng tiktok-live-connector
 */
function connectToTikTokLive(username) {
    console.log(`📡 Đang kết nối tới TikTok Live của: @${username}...`);

    let WebcastPushConnection;
    try {
        const connector = require('tiktok-live-connector');
        WebcastPushConnection = connector.WebcastPushConnection;
    } catch (err) {
        console.error('❌ Chưa cài đặt thư viện tiktok-live-connector!');
        console.error('👉 Vui lòng chạy lệnh: npm install');
        console.log('🔄 Đang chuyển sang chế độ MÔ PHỎNG để bạn tiếp tục test giao diện...');
        startMockSimulation();
        return;
    }

    // Khởi tạo connector
    const tiktokLiveConnection = new WebcastPushConnection(username, {
        processInitialData: true,
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 1000,
        clientParams: {
            app_language: 'vi-VN',
            webcast_language: 'vi-VN'
        }
    });

    // Kết nối
    tiktokLiveConnection.connect()
        .then(state => {
            console.log(`✅ KẾT NỐI THÀNH CÔNG phòng Live! RoomId: ${state.roomId}`);
            console.log('👀 Đang lắng nghe sự kiện Chat, Like, Gift...');
        })
        .catch(err => {
            console.error(`❌ Kết nối thất bại tới @${username}:`, err.message || err);
            console.log('----------------------------------------------------');
            console.log('💡 Nguyên nhân thường gặp:');
            console.log('   1. Tài khoản không đang livestream lúc này.');
            console.log('   2. Sai tên @username.');
            console.log('   3. TikTok yêu cầu Captcha hoặc chặn IP tạm thời.');
            console.log('👉 Server vẫn mở để bạn test offline hoặc chạy chế độ mock: node server.js --mock');
            console.log('----------------------------------------------------');
        });

    // 1. SỰ KIỆN CHAT
    tiktokLiveConnection.on('chat', data => {
        const comment = (data.comment || '').trim().toLowerCase();
        let action = 'chat';

        // Phân tích từ khóa tương tác
        if (comment.includes('nhay') || comment.includes('jump') || comment.includes('len') || comment.includes('1')) {
            action = 'jump';
        } else if (comment.includes('chay') || comment.includes('run') || comment.includes('speed') || comment.includes('boost') || comment.includes('2')) {
            action = 'boost';
        }

        console.log(`[CHAT] 💬 ${data.uniqueId}: "${data.comment}" -> Action: ${action}`);

        broadcast('chat', {
            uniqueId: data.uniqueId,
            nickname: data.nickname || data.uniqueId,
            profilePictureUrl: data.profilePictureUrl
        }, {
            comment: data.comment,
            action: action
        });
    });

    // 2. SỰ KIỆN LIKE (THẢ TIM)
    tiktokLiveConnection.on('like', data => {
        console.log(`[LIKE] ❤️ ${data.uniqueId} đã thả ${data.likeCount} tim! (Tổng tim phiên: ${data.totalLikeCount})`);

        broadcast('like', {
            uniqueId: data.uniqueId,
            nickname: data.nickname || data.uniqueId,
            profilePictureUrl: data.profilePictureUrl
        }, {
            likeCount: data.likeCount || 1,
            totalLikeCount: data.totalLikeCount
        });
    });

    // 3. SỰ KIỆN GIFT (TẶNG QUÀ)
    tiktokLiveConnection.on('gift', data => {
        // TikTok gift streak check:
        // giftType = 1 là combo streak (hoa hồng, mini quà); chỉ xử lý khi repeatEnd = true hoặc mỗi đợt tăng
        if (data.giftType === 1 && !data.repeatEnd) {
            // Đang trong chuỗi streak combo, vẫn có thể nhận tín hiệu
            return;
        }

        const giftName = data.giftName || 'Quà bí mật';
        const giftCount = data.repeatCount || 1;
        const diamondCount = data.diamondCount || 1;
        const totalValue = diamondCount * giftCount;

        console.log(`[GIFT] 🎁 ${data.uniqueId} tặng x${giftCount} "${giftName}" (${totalValue} kim cương)!`);

        // Phân loại quà để kích hoạt hiệu ứng trong game:
        // - "Rose" hoặc "Hoa hồng": Tăng tốc (Boost)
        // - "Heart" hoặc "Tim": Siêu Nhảy (Super Jump)
        // - Quà lớn (> 10 kim cương): Mega Boost + Khổng lồ hóa
        let action = 'boost';
        let boostDuration = 3500;
        let speedMultiplier = 2.2;

        const lowerGift = giftName.toLowerCase();
        if (lowerGift.includes('rose') || lowerGift.includes('hoa hồng') || lowerGift.includes('bông hoa')) {
            action = 'boost';
            boostDuration = 4000;
            speedMultiplier = 2.5;
        } else if (lowerGift.includes('heart') || lowerGift.includes('tim') || lowerGift.includes('love')) {
            action = 'jump';
        } else if (totalValue >= 10) {
            action = 'mega_boost';
            boostDuration = 6000;
            speedMultiplier = 3.5;
        }

        broadcast('gift', {
            uniqueId: data.uniqueId,
            nickname: data.nickname || data.uniqueId,
            profilePictureUrl: data.profilePictureUrl
        }, {
            giftId: data.giftId,
            giftName: giftName,
            giftCount: giftCount,
            diamondCount: totalValue,
            action: action,
            boostDuration: boostDuration,
            speedMultiplier: speedMultiplier
        });
    });

    // 4. SỰ KIỆN THÀNH VIÊN VÀO PHÒNG (MEMBER)
    tiktokLiveConnection.on('member', data => {
        // Tự động sinh nhân vật khi có người vào xem
        broadcast('member', {
            uniqueId: data.uniqueId,
            nickname: data.nickname || data.uniqueId,
            profilePictureUrl: data.profilePictureUrl
        }, {
            action: 'spawn'
        });
    });

    // Xử lý ngắt kết nối
    tiktokLiveConnection.on('disconnected', () => {
        console.warn('⚠️ Kết nối TikTok Live đã bị ngắt.');
    });

    tiktokLiveConnection.on('error', err => {
        console.error('❌ Lỗi TikTok Live Connection:', err);
    });
}

/**
 * Bộ tạo sự kiện ngẫu nhiên (Mock Simulator) giúp test gameplay mượt mà
 */
function startMockSimulation() {
    console.log('🚀 Bộ tạo sự kiện Mock tự động đã khởi chạy!');
    console.log('🎲 Đang tự động gửi chat, like, hoa hồng giả lập mỗi 2 - 4 giây...');

    const sampleUsers = [
        { uniqueId: 'gau_nau_99', nickname: 'Gấu Nâu 🐻' },
        { uniqueId: 'chibi_king', nickname: 'Chibi King 👑' },
        { uniqueId: 'meo_cute', nickname: 'Mèo Ú 🐱' },
        { uniqueId: 'ronaldo_fan', nickname: 'CR7 Idol ⚡' },
        { uniqueId: 'hacker_pro', nickname: 'Trùm Cuối 🚀' },
        { uniqueId: 'linh_nhi', nickname: 'Linh Nhi 🌸' }
    ];

    const sampleComments = [
        { text: 'chay di ban oi!', action: 'boost' },
        { text: 'nhay len nao', action: 'jump' },
        { text: 'Co len meo ut!', action: 'boost' },
        { text: 'game hay qua', action: 'chat' },
        { text: 'nhay vuot rao 1 1 1', action: 'jump' },
        { text: 'tang toc ve dich nao!', action: 'boost' }
    ];

    const sampleGifts = [
        { giftName: 'Hoa Hồng', action: 'boost', speedMultiplier: 2.5, boostDuration: 4000, diamond: 1 },
        { giftName: 'Trái Tim Yêu Thương', action: 'jump', diamond: 1 },
        { giftName: 'Mũ Ảo Thuật', action: 'boost', speedMultiplier: 2.0, boostDuration: 3000, diamond: 5 },
        { giftName: 'Xe Thể Thao', action: 'mega_boost', speedMultiplier: 3.5, boostDuration: 6000, diamond: 100 }
    ];

    // Khởi tạo một vài nhân vật ngay từ đầu
    setTimeout(() => {
        sampleUsers.slice(0, 4).forEach(u => {
            broadcast('member', u, { action: 'spawn' });
        });
    }, 1500);

    // Vòng lặp bắn event ngẫu nhiên
    setInterval(() => {
        if (wss.clients.size === 0) return; // Chưa có tab game nào mở

        const randUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
        const randEvent = Math.random();

        if (randEvent < 0.45) {
            // Chat
            const c = sampleComments[Math.floor(Math.random() * sampleComments.length)];
            broadcast('chat', randUser, { comment: c.text, action: c.action });
        } else if (randEvent < 0.75) {
            // Like
            const count = Math.floor(Math.random() * 15) + 5;
            broadcast('like', randUser, { likeCount: count, totalLikeCount: 999 });
        } else {
            // Gift
            const g = sampleGifts[Math.floor(Math.random() * sampleGifts.length)];
            broadcast('gift', randUser, {
                giftName: g.giftName,
                giftCount: 1,
                diamondCount: g.diamond,
                action: g.action,
                speedMultiplier: g.speedMultiplier || 2.2,
                boostDuration: g.boostDuration || 3500
            });
        }
    }, 2500);
}

// Bắt đầu lắng nghe cổng 8080
server.listen(PORT, () => {
    console.log(`🌐 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`🎮 Mở trình duyệt và truy cập: http://localhost:${PORT} để chơi ngay!`);
    console.log('====================================================\n');
});

