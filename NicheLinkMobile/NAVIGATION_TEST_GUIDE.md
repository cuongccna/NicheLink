# NAVIGATION ROLE TESTING GUIDE

## Trạng thái hiện tại
- ✅ Server đã chạy và sẵn sàng
- ✅ QR code đã hiển thị
- ✅ Mock authentication đang hoạt động
- ✅ Role debugger đã được thêm vào trang chủ

## BƯỚC TEST NAVIGATION ROLE SWITCHING

### 1. Kết nối với Expo Go
- Mở Expo Go app trên điện thoại
- Scan QR code từ terminal
- App sẽ load và tự động đăng nhập

### 2. Kiểm tra Role hiện tại
- Mở trang "Trang chủ" (tab đầu tiên)
- Tìm "Role Debug Panel" ở phía trên
- Xem Current Role và Email hiện tại

### 3. Test SME Navigation (5 tabs + center button)
**Login as SME:** sme@test.com / password

**Expected SME Layout:**
```
[Trang chủ] [Chiến dịch] [(+) Tạo mới] [Tin nhắn] [Hồ sơ]
```

**Kiểm tra:**
- ✅ Có đúng 5 tabs
- ✅ Tab giữa là "(+) Tạo mới" với icon plus lớn
- ✅ Tabs: Trang chủ, Chiến dịch, Tạo mới, Tin nhắn, Hồ sơ
- ✅ Tab "Chiến dịch" hoạt động (campaigns.tsx)
- ✅ Tab "Tạo mới" hoạt động (create-campaign.tsx)

### 4. Test KOC Navigation (4 tabs clean)
**Login as KOC:** admin@nichelink.com / admin123

**Expected KOC Layout:**
```
[Bảng tin] [Nhiệm vụ] [Tin nhắn] [Hồ sơ]
```

**Kiểm tra:**
- ✅ Có đúng 4 tabs
- ✅ Không có center button (+)
- ✅ Tabs: Bảng tin, Nhiệm vụ, Tin nhắn, Hồ sơ
- ✅ Tab "Nhiệm vụ" hoạt động (my-tasks.tsx)
- ✅ Layout gọn gàng, không cluttered

### 5. Test Role Switching
**Cách switch roles:**
1. Trong Role Debug Panel, tap "Test SME" hoặc "Test KOC"
2. App sẽ logout
3. Login lại với credentials tương ứng
4. Kiểm tra navigation layout đã thay đổi

### 6. Test Hidden Screens
**Screens này KHÔNG xuất hiện trong tab bar nhưng vẫn accessible:**
- chat.tsx
- koc-profile-an.tsx  
- campaign-detail-sme.tsx
- explore.tsx
- demo-navigation.tsx
- discovery.tsx
- workspace.tsx

## MOCK ACCOUNTS

### SME Account
- **Email:** sme@test.com
- **Password:** password
- **Expected:** 5 tabs với center (+) button

### KOC Account  
- **Email:** admin@nichelink.com
- **Password:** admin123
- **Expected:** 4 tabs clean layout

### Test Account
- **Email:** test@example.com
- **Password:** 123456
- **Role:** SME (5 tabs)

## TROUBLESHOOTING

### Nếu navigation không đúng:
1. Check Role Debug Panel xem role có đúng không
2. Logout và login lại
3. Restart Expo server nếu cần: Ctrl+C → npx expo start

### Nếu tab không hiển thị:
1. Kiểm tra file _layout.tsx
2. Đảm bảo href: null cho hidden screens
3. Check console logs

## SUCCESS CRITERIA
- [x] SME user thấy 5 tabs với center (+) button
- [x] KOC user thấy 4 tabs clean layout  
- [x] Navigation flow smooth
- [x] Hidden screens accessible nhưng không hiển thị trong tab bar
- [x] Role switching hoạt động chính xác
