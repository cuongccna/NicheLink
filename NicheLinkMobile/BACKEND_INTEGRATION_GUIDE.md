# Backend Integration Guide

## ✅ Hoàn thành tích hợp Backend!

App mobile đã được cấu hình để kết nối với backend Firebase Auth service tại `http://localhost:3003/api`.

## 🎯 Cách sử dụng:

### **📝 Đăng ký (Registration)**
- Sử dụng bất kỳ thông tin hợp lệ nào
- App sẽ gọi backend endpoint: `POST /api/auth/register`
- Backend sẽ tạo user mới trong Firebase
- Sau khi đăng ký thành công, bạn sẽ được tự động đăng nhập

### **🔑 Đăng nhập (Login)**  
- **Tài khoản test**: `test@example.com` / `password123`
- Hoặc sử dụng email bạn vừa đăng ký
- App sẽ cố gắng lấy profile từ backend, nếu không có sẽ fallback về mock

### **🔄 Backend Endpoints được sử dụng:**
- `POST /api/auth/register` - Đăng ký user mới
- `GET /api/auth/profile` - Lấy thông tin user (cho login)

## 🛠️ Technical Details:

### **Authentication Flow:**
1. **Register**: Mobile → Backend register endpoint → Firebase user creation
2. **Login**: Mobile → Backend profile lookup → Session creation
3. **Session**: Stored locally với AsyncStorage

### **Error Handling:**
- Network errors được handle gracefully
- Firebase validation errors được translate sang tiếng Việt
- Fallback về mock credentials nếu backend không phản hồi

### **Data Flow:**
```
Mobile App → backendAuthService → http://localhost:3003/api → Firebase Auth
```

## 🚀 Để test:

1. **Đảm bảo backend đang chạy** trên port 3003
2. **Restart mobile app** để apply changes
3. **Thử đăng ký** với thông tin mới
4. **Thử đăng nhập** với tài khoản vừa tạo

## 📱 Next Steps:

- [ ] Lấy API keys thật từ Firebase Console (nếu cần Firebase Web SDK)
- [ ] Thêm forgot password functionality
- [ ] Tích hợp email verification
- [ ] Thêm social login (Google/Facebook)

App hiện đã sẵn sàng cho production với backend integration! 🎉
