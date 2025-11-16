# Hướng dẫn Debug Comment Service

## Lỗi "Network Error" - Các bước kiểm tra

### 1. Kiểm tra các service có đang chạy không

#### API Gateway (port 8081)
```bash
# Kiểm tra API Gateway
curl http://localhost:8081/api/story
# Hoặc mở browser: http://localhost:8081/api/story
```

#### Comment Service (port 8883)
```bash
# Kiểm tra Comment Service trực tiếp
curl http://localhost:8883/api/comments/story/1/root
# Hoặc mở browser: http://localhost:8883/api/comments/story/1/root
```

### 2. Khởi động các service

#### Khởi động API Gateway
```bash
cd services/api-gateway
mvn spring-boot:run
```

#### Khởi động Comment Service
```bash
cd services/comment-service
mvn spring-boot:run
```

### 3. Kiểm tra Database

Comment Service cần PostgreSQL database `comment_db`:
```bash
# Kiểm tra PostgreSQL có chạy không
# Windows: Services -> PostgreSQL
# Linux/Mac: sudo systemctl status postgresql

# Tạo database nếu chưa có
psql -U postgres
CREATE DATABASE comment_db;
\q
```

### 4. Kiểm tra cấu hình

#### API Gateway routing
File: `services/api-gateway/src/main/resources/application.yml`
```yaml
- id: comment-service
  uri: http://localhost:8883
  predicates:
    - Path=/api/comments/**
```

#### Comment Service port
File: `services/comment-service/src/main/resources/application.properties`
```properties
server.port=8883
```

### 5. Kiểm tra Console trong Browser

Mở Developer Tools (F12) và kiểm tra:
- **Console tab**: Xem có lỗi JavaScript không
- **Network tab**: 
  - Xem request có được gửi đi không
  - Xem response status code
  - Xem CORS errors

### 6. Test API trực tiếp

#### Test qua API Gateway
```bash
curl http://localhost:8081/api/comments/story/1/root
```

#### Test trực tiếp Comment Service
```bash
curl http://localhost:8883/api/comments/story/1/root
```

### 7. Các lỗi thường gặp

#### "Connection refused"
- Service chưa được khởi động
- Port bị conflict với service khác
- Firewall chặn kết nối

#### "CORS error"
- Đã thêm CORS config vào comment-service
- API Gateway đã có CORS config
- Kiểm tra `allowedOriginPatterns` trong config

#### "404 Not Found"
- Kiểm tra path trong API Gateway routing
- Kiểm tra path trong CommentController
- Đảm bảo path khớp nhau

#### "500 Internal Server Error"
- Kiểm tra database connection
- Kiểm tra logs của comment-service
- Kiểm tra RabbitMQ connection (nếu cần)

### 8. Logs để kiểm tra

#### Comment Service logs
Tìm trong console output khi chạy `mvn spring-boot:run`:
- `Started CommentServiceApplication`
- Database connection messages
- Port binding: `Tomcat started on port(s): 8883`

#### API Gateway logs
Tìm trong console output:
- `Started ApiGatewayApplication`
- Route registration: `Route matched: comment-service`

### 9. Quick Fix Checklist

- [ ] API Gateway đang chạy trên port 8081
- [ ] Comment Service đang chạy trên port 8883
- [ ] PostgreSQL đang chạy và có database `comment_db`
- [ ] API Gateway routing đúng: `/api/comments/**` → `http://localhost:8883`
- [ ] CORS đã được cấu hình
- [ ] Frontend đang gọi đúng URL: `http://localhost:8081/api/comments/...`
- [ ] Không có firewall chặn các port

### 10. Test với Postman/Insomnia

Test endpoint:
```
GET http://localhost:8081/api/comments/story/1/root
```

Headers (nếu cần auth):
```
Authorization: Bearer <token>
```

