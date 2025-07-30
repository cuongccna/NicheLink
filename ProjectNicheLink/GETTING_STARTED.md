# NicheLink - Getting Started Guide

## Yêu cầu hệ thống

- **Node.js**: 20.0.0 hoặc cao hơn
- **Docker**: Phiên bản mới nhất
- **Git**: Phiên bản mới nhất
- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB)
- **Ổ đĩa**: Tối thiểu 2GB trống

## Cài đặt nhanh

### 1. Clone repository
```bash
git clone <repository-url>
cd ProjectNicheLink
```

### 2. Chạy script setup

#### Trên Windows (PowerShell):
```powershell
# Mở PowerShell với quyền Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
./setup.ps1
```

#### Trên macOS/Linux:
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Cập nhật cấu hình

Mở file `backend/auth-service/.env` và cập nhật các thông tin cần thiết:

```env
# Database - Giữ nguyên nếu dùng Docker
DATABASE_URL="postgresql://nichelink:nichelink123@localhost:5432/nichelink?schema=public"

# JWT - Thay đổi secret key
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Firebase - Cập nhật thông tin Firebase project
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"
```

### 4. Khởi động dự án

```bash
# Khởi động tất cả services
npm run dev

# Hoặc chỉ khởi động backend
npm run dev:backend
```

## Kiểm tra cài đặt

### 1. Health Check
Mở trình duyệt và truy cập:
- **Auth Service**: http://localhost:3001/api/health
- **Detailed Health**: http://localhost:3001/api/health/detailed

### 2. Database
```bash
# Kiểm tra PostgreSQL
docker exec -it nichelink-postgres psql -U nichelink -d nichelink -c "SELECT version();"

# Kiểm tra MongoDB
docker exec -it nichelink-mongodb mongosh --eval "db.version()"

# Kiểm tra Redis
docker exec -it nichelink-redis redis-cli ping
```

## Cấu trúc dự án

```
ProjectNicheLink/
├── backend/
│   ├── auth-service/       # Xác thực và quản lý người dùng
│   ├── campaign-service/   # Quản lý chiến dịch
│   ├── messaging-service/  # Chat và thông báo
│   ├── payment-service/    # Thanh toán
│   └── analytics-service/  # Báo cáo và phân tích
├── mobile-app/             # Ứng dụng React Native
├── shared/                 # Thư viện và types chung
└── docs/                   # Tài liệu
```

## Commands hữu ích

### Development
```bash
# Khởi động tất cả services
npm run dev

# Khởi động từng service riêng lẻ
npm run dev:auth
npm run dev:campaign
npm run dev:messaging

# Khởi động mobile app
npm run dev:mobile
```

### Docker
```bash
# Khởi động databases
npm run docker:up

# Dừng tất cả containers
npm run docker:down

# Xem logs
npm run docker:logs
```

### Database
```bash
# Chạy migrations
cd backend/auth-service
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset
```

### Testing
```bash
# Chạy tests cho tất cả services
npm run test

# Chạy tests cho service cụ thể
npm run test:auth
npm run test:campaign
```

## Troubleshooting

### Lỗi thường gặp

#### 1. "Cannot connect to database"
```bash
# Kiểm tra Docker containers
docker ps

# Restart databases
docker-compose restart postgres mongodb redis
```

#### 2. "Port already in use"
```bash
# Tìm process đang sử dụng port
# Windows
netstat -ano | findstr :3001

# macOS/Linux
lsof -ti:3001

# Kill process
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

#### 3. "Prisma Client not found"
```bash
cd backend/auth-service
npx prisma generate
```

#### 4. "Redis connection failed"
```bash
# Restart Redis
docker restart nichelink-redis

# Check Redis logs
docker logs nichelink-redis
```

### Reset toàn bộ

Nếu gặp vấn đề nghiêm trọng:

```bash
# Dừng tất cả containers
docker-compose down

# Xóa volumes (CẢNH BÁO: Sẽ mất dữ liệu)
docker-compose down -v

# Xóa node_modules
rm -rf node_modules backend/*/node_modules

# Cài đặt lại
npm run install:all

# Khởi động lại
npm run docker:up
npm run dev
```

## Phát triển tiếp theo

### Sprint 2: Authentication Implementation
1. Implement user registration/login
2. Firebase Authentication integration
3. JWT token management
4. User profile management

### Sprint 3: Marketplace Core
1. Campaign creation (SMEs)
2. Campaign discovery (Influencers)
3. Application and acceptance flow
4. Basic filtering and search

Hãy đọc [README.md](./README.md) để biết thêm chi tiết về kiến trúc và kế hoạch phát triển.

## Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra logs của services
2. Đọc phần Troubleshooting
3. Tạo issue trên GitHub repository
