# Hướng dẫn cài đặt PostgreSQL cho NicheLink

## 📥 Tải và cài đặt PostgreSQL

### Bước 1: Download PostgreSQL
1. Truy cập: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Chọn phiên bản mới nhất (16.x khuyến nghị)
4. Download file `.exe`

### Bước 2: Cài đặt PostgreSQL
1. **Chạy installer với quyền Administrator**
2. **Installation Directory**: Giữ mặc định (`C:\Program Files\PostgreSQL\16`)
3. **Components**: Chọn tất cả:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ✅ Stack Builder
   - ✅ Command Line Tools
4. **Data Directory**: Giữ mặc định
5. **Password**: Nhập mật khẩu cho user `postgres` (VD: `admin123`)
   - ⚠️ **QUAN TRỌNG**: Nhớ mật khẩu này!
6. **Port**: 5432 (mặc định)
7. **Locale**: English, United States
8. Click "Next" và hoàn thành cài đặt

## 🔧 Thiết lập Database cho NicheLink

### Phương pháp 1: Sử dụng pgAdmin (Đơn giản nhất)
1. **Mở pgAdmin 4** (Start Menu → pgAdmin 4)
2. **Connect tới server**:
   - Right-click "PostgreSQL 16" → "Connect Server"
   - Nhập password của user `postgres`
3. **Tạo database**:
   - Right-click "Databases" → "Create" → "Database"
   - Database name: `nichelink`
   - Owner: `postgres`
   - Click "Save"
4. **Tạo user**:
   - Expand "nichelink" database
   - Right-click "Login/Group Roles" → "Create" → "Login/Group Role"
   - General tab: Name = `nichelink`
   - Definition tab: Password = `nichelink123`
   - Privileges tab: ✅ Can login?, ✅ Create databases?
   - Click "Save"
5. **Cấp quyền**:
   - Right-click database "nichelink" → "Properties"
   - Security tab → Add: 
     - Grantee: `nichelink`
     - Privileges: ALL
   - Click "Save"

### Phương pháp 2: Sử dụng Command Line
```bash
# Mở Command Prompt hoặc PowerShell

# Connect as postgres user
psql -U postgres -h localhost

# Chạy các lệnh SQL (copy từ database-setup.sql)
CREATE DATABASE nichelink;
CREATE USER nichelink WITH PASSWORD 'nichelink123';
GRANT ALL PRIVILEGES ON DATABASE nichelink TO nichelink;
\c nichelink;
GRANT ALL ON SCHEMA public TO nichelink;

# Thoát psql
\q
```

## ✅ Kiểm tra cài đặt

### Test 1: PostgreSQL Service
```powershell
# Kiểm tra service đang chạy
Get-Service postgresql*
# Kết quả mong đợi: Status = Running
```

### Test 2: Connection Test
```powershell
# Test connection với postgres user
psql -U postgres -h localhost

# Test connection với nichelink user
psql -U nichelink -h localhost -d nichelink
```

### Test 3: Version Check
```powershell
psql --version
# Kết quả mong đợi: psql (PostgreSQL) 16.x
```

## 🛠️ Troubleshooting

### Lỗi: "psql is not recognized"
**Nguyên nhân**: PostgreSQL chưa được thêm vào PATH

**Giải pháp**:
1. Mở System Properties → Environment Variables
2. Thêm vào PATH: `C:\Program Files\PostgreSQL\16\bin`
3. Restart Command Prompt

### Lỗi: "connection refused"
**Nguyên nhân**: PostgreSQL service chưa chạy

**Giải pháp**:
```powershell
# Start service
Start-Service postgresql-x64-16

# Hoặc qua Services.msc
services.msc
# Tìm "postgresql-x64-16" → Start
```

### Lỗi: "authentication failed"
**Nguyên nhân**: Sai password hoặc user không tồn tại

**Giải pháp**:
1. Kiểm tra lại password postgres
2. Tạo lại user nichelink
3. Kiểm tra pg_hba.conf nếu cần

### Lỗi: "database does not exist"
**Giải pháp**:
```sql
-- Connect as postgres
psql -U postgres
-- Tạo database
CREATE DATABASE nichelink;
```

## 📊 Tools hữu ích

### pgAdmin 4
- **Mục đích**: GUI management tool
- **URL**: http://localhost:5050 (thường)
- **Login**: Email và password đã setup

### Prisma Studio
```bash
cd backend/auth-service
npx prisma studio
# Mở: http://localhost:5555
```

### DBeaver (Optional)
- Free database tool
- Download: https://dbeaver.io/download/
- Connect với: localhost:5432, user: nichelink

## 🔄 Sau khi setup xong

1. **Chạy setup script**:
   ```powershell
   cd ProjectNicheLink
   powershell -ExecutionPolicy Bypass -File setup-postgresql.ps1
   ```

2. **Start development**:
   ```bash
   cd backend/auth-service
   npm run dev
   ```

3. **Verify health check**:
   - Mở: http://localhost:3001/api/health
   - Kiểm tra database status = "healthy"
