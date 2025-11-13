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

### 1. Tạo file `.env` (tùy chọn)
Tạo file `.env` ở thư mục `web/` nếu muốn override cấu hình mặc định:

```env
# API Gateway URL (mặc định: http://localhost:8081)
VITE_API_GATEWAY_URL=http://localhost:8081

# Crawler API URL (mặc định: http://localhost:4000)
VITE_CRAWLER_API_URL=http://localhost:4000

# OAuth Configuration (tùy chọn)
VITE_OAUTH_ISSUER=https://auth.example.com/realms/truyenz
VITE_OAUTH_CLIENT_ID=truyenz-web
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback
VITE_OAUTH_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
VITE_OAUTH_SCOPE=openid profile email
```

### 2. Chạy các service backend

**Quan trọng:** Trước khi chạy frontend, bạn cần đảm bảo các service sau đang chạy:

#### Chạy bằng IntelliJ IDEA (Khuyến nghị)

1. **Mở project trong IntelliJ IDEA**
   - Mở thư mục `web/services/api-gateway` hoặc `web/services/user-service`

2. **Khởi động API Gateway (port 8081)**
   - Mở file: `web/services/api-gateway/src/main/java/.../ApiGatewayApplication.java`
   - Click Run hoặc Debug
   - Hoặc chạy từ Maven: `mvn spring-boot:run`

3. **Khởi động User Service (port 8882)**
   - Mở file: `web/services/user-service/src/main/java/.../UserServiceApplication.java`
   - Click Run hoặc Debug
   - Hoặc chạy từ Maven: `mvn spring-boot:run`

4. **Kiểm tra services đã chạy**
   - API Gateway: http://localhost:8081
   - User Service: http://localhost:8882

#### Yêu cầu hệ thống

- Java 17+
- Maven 3.6+ (hoặc sử dụng Maven wrapper `mvnw`)
- PostgreSQL đang chạy (port 5432)
- Database `user_db` đã được tạo

#### Cấu hình Database

User Service cần PostgreSQL với cấu hình:
- Host: `localhost:5432`
- Database: `user_db`
- Username: `postgres`
- Password: `postgres123`

Nếu database chưa có, tạo bằng:
```sql
CREATE DATABASE user_db;
```

**Lưu ý:** 
- Nếu các service chưa chạy, frontend sẽ hiển thị lỗi "Không thể kết nối đến server"
- Bạn có thể sử dụng tài khoản mock để test: `admin@truyenz.com / admin123`
- Đợi 30-60 giây để các service khởi động hoàn toàn

## Kiến trúc UI
- React Router: điều hướng các trang chính (Home, Chi tiết truyện, Đọc chương, Hồ sơ)
- Tailwind CSS: UI hiện đại, hỗ trợ dark mode (class)
- OAuth2 (Authorization Code + PKCE) bằng `oidc-client-ts`
- Axios: gọi API đến API Gateway tương ứng microservices


