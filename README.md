# PredictWC

Ứng dụng dự đoán Cúp Thế giới được xây dựng bằng React, Vite, Tailwind CSS và Firestore.

## Tính năng

- Chế độ khách không cần đăng nhập
- Quản trị viên quản lý trận đấu thủ công
- Nhập lịch thi đấu từ JSON
- Bảng xếp hạng theo thời gian thực
- Chấm điểm dự đoán và tự động cập nhật điểm

## Cài đặt cục bộ

1. Cài đặt thư viện:

```bash
npm install
```

2. Tạo `.env` từ `.env.example` và điền đầy đủ giá trị Firebase.

3. Chạy ứng dụng:

```bash
npm run dev
```

4. Đóng gói bản production:

```bash
npm run build
```

## Bộ sưu tập Firestore

- `users`
- `matches`
- `predictions`

## Định dạng trận đấu

```json
{
  "id": "match-001",
  "homeTeam": "Argentina",
  "awayTeam": "France",
  "homeLogo": "",
  "awayLogo": "",
  "matchTime": "2026-06-12T18:00:00Z",
  "status": "upcoming",
  "homeScore": null,
  "awayScore": null,
  "winner": null
}
```

## Luồng quản trị

- Thêm trận đấu thủ công
- Sửa trận đấu
- Xóa trận đấu
- Nhập `matches.json`
- Đặt tỷ số và đánh dấu trận đấu là `finished`
- Ứng dụng tự động tính lại điểm dự đoán và tổng điểm bảng xếp hạng

## Đơn vị người chơi

- Nhóm mặc định sử dụng các đường dẫn hiện tại như `/matches` và `/leaderboard`.
- Đơn vị `donvi` sử dụng `/donvi/matches`, `/donvi/leaderboard` và `/donvi/admin`.
- Các đơn vị dùng chung lịch thi đấu và kết quả, nhưng tài khoản, dự đoán và bảng xếp hạng được tách theo `unitId`.
- Tài khoản đầu tiên đăng ký tại `/donvi` được cấp quyền quản trị của đơn vị đó.
