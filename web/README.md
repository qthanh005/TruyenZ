# TruyệnZ Frontend (Vite + React + TS)

## Yêu cầu
- Node.js 18+ và npm/yarn/pnpm

## Cài đặt
```bash
# Cài dependencies
npm install

# Chạy dev
npm run dev

# Build
npm run build
# Xem build
npm run preview
```

## Cấu hình môi trường
Tạo file `.env` ở thư mục `web/` dựa trên `.env.example`:

```
VITE_API_GATEWAY_URL=https://api.truyenz.example.com
VITE_OAUTH_ISSUER=https://auth.example.com/realms/truyenz
VITE_OAUTH_CLIENT_ID=truyenz-web
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback
VITE_OAUTH_POST_LOGOUT_REDIRECT_URI=http://localhost:5173/
VITE_OAUTH_SCOPE=openid profile email
```

## Kiến trúc UI
- React Router: điều hướng các trang chính (Home, Chi tiết truyện, Đọc chương, Hồ sơ)
- Tailwind CSS: UI hiện đại, hỗ trợ dark mode (class)
- OAuth2 (Authorization Code + PKCE) bằng `oidc-client-ts`
- Axios: gọi API đến API Gateway tương ứng microservices


