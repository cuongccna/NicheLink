# Luồng Điều Hướng SME - NicheLink Mobile

## Tổng Quan
Logic Navigation cho người dùng SME được thiết kế với mục tiêu: **Quản lý tổng quan**, **Tạo chiến dịch**, và **Theo dõi hiệu quả**.

## A. Thanh Điều Hướng Dưới Cùng (Bottom Tab Bar)

### 4 Tab Chính + 1 Nút Hành Động Trung Tâm:

1. **🏠 Trang chủ (Dashboard)** - `index.tsx`
   - Icon: `house.fill`
   - Màn hình tổng quan nhanh cho SME

2. **💼 Chiến dịch** - `campaigns.tsx`
   - Icon: `briefcase.fill`
   - Trung tâm quản lý tất cả chiến dịch

3. **➕ Tạo mới** - `create-campaign.tsx`
   - Icon: `plus.circle.fill` (Size 36, nổi bật ở giữa)
   - Nút hành động chính, điều hướng đến màn hình tạo chiến dịch

4. **💬 Tin nhắn** - `messages.tsx`
   - Icon: `message.fill`
   - Quản lý tất cả các cuộc hội thoại với KOC

5. **👤 Hồ sơ** - `profile.tsx`
   - Icon: `person.fill`
   - Quản lý tài khoản và cài đặt

## B. Luồng Điều Hướng Chi Tiết

### 1. 🏠 Từ Tab Trang chủ (Dashboard)

#### Navigation Functions Implemented:
```typescript
const navigateToCampaignDetail = (campaignId: string) => {
  router.push('/campaign-detail-sme' as any);
};

const navigateToKOCProfile = (kocId: string) => {
  router.push('/koc-profile-an' as any);
};

const navigateToChat = (userId: string) => {
  router.push('/chat' as any);
};

const navigateToNotifications = () => {
  router.push('/notifications' as any);
};

const navigateToContentReview = () => {
  router.push('/content-review' as any);
};
```

#### Hành Động Nhanh (Quick Actions):
- **Tạo chiến dịch** → `/create-campaign`
- **Tìm KOC** → `/explore`
- **Báo cáo** → `/campaign-management`
- **Cài đặt** → `/profile`

#### Hoạt Động Gần Đây:
- **Chiến dịch hoàn thành** → `navigateToCampaignDetail(campaignId)`
- **KOC mới tham gia** → `navigateToKOCProfile(kocId)`
- **Nội dung chờ duyệt** → `navigateToContentReview()`

#### Thông Báo:
- **Notification Bell** → `navigateToNotifications()`

### 2. ➕ Từ Nút Tạo mới

- **Nhấn nút (+)** → Điều hướng đến `/create-campaign` (bước 1)
- **Hoàn thành tạo chiến dịch** → Điều hướng đến `/campaign-detail-sme` (chiến dịch vừa tạo)

### 3. 💼 Từ Tab Chiến dịch

#### Tab Con (Secondary Navigation):
- **"Đang chạy"** - Campaigns with status: 'running'
- **"Chờ duyệt"** - Campaigns with status: 'pending'  
- **"Đã hoàn thành"** - Campaigns with status: 'completed'
- **"Bản nháp"** - Campaigns with status: 'draft'

#### Navigation trong Campaign Detail:
```typescript
// Từ Campaign List
const handleCampaignPress = (campaign: Campaign) => {
  router.push('/campaign-detail-sme' as any);
};

// Từ Campaign Detail Screen:
// - Nhấn vào tên/ảnh KOC → '/koc-profile-an'
// - Nhấn nút "Chat" → '/chat' (với KOC đó)
// - Nhấn "Duyệt nội dung" → '/content-review'
// - Nhấn "Xác nhận Hoàn thành" → Payment confirmation popup
// - Nhấn "Đánh giá" → Rating modal
```

### 4. 💬 Từ Tab Tin nhắn

#### Conversation Navigation:
```typescript
const navigateToChat = (conversationId: string) => {
  router.push('/chat' as any);
};
```

#### Features:
- **Danh sách cuộc hội thoại** với filter (Tất cả/Chưa đọc/KOC)
- **Search conversations** by name or message content
- **Click conversation** → Điều hướng đến `/chat`

### 5. 👤 Từ Tab Hồ sơ

#### Menu Navigation Implemented:
```typescript
// Tài khoản Section
'Thông tin cá nhân' → '/profile-edit'
'Phương thức thanh toán' → '/payment-history'  
'Hợp đồng của tôi' → '/contracts'
'Thống kê & Báo cáo' → '/campaign-management' (SME only)

// Cài đặt Section  
'Ngôn ngữ' → '/language-settings'

// Hỗ trợ Section
'Trợ giúp & Hỗ trợ' → '/help'
'Điều khoản sử dụng' → '/terms'
'Chính sách bảo mật' → '/privacy'

// Developer Tools
'Thay đổi Role' → '/role-settings'
```

## C. Hidden Screens (Accessible via Navigation)

Các màn hình sau được configured trong `_layout.tsx` với `{ href: null }`:

### Core Screens:
- `chat` - Chi tiết cuộc trò chuyện
- `koc-profile-an` - Hồ sơ KOC chi tiết
- `campaign-detail-sme` - Chi tiết chiến dịch cho SME
- `explore` - Tìm kiếm KOC
- `campaign-management` - Quản lý chiến dịch & báo cáo

### Feature Screens:
- `notifications` - Danh sách thông báo
- `content-review` - Duyệt nội dung từ KOC
- `payment-history` - Lịch sử thanh toán
- `profile-edit` - Chỉnh sửa thông tin doanh nghiệp

### Settings Screens:
- `contracts` - Quản lý hợp đồng
- `reviews` - Đánh giá & phản hồi
- `language-settings` - Cài đặt ngôn ngữ
- `help` - Trợ giúp & hỗ trợ
- `terms` - Điều khoản sử dụng
- `privacy` - Chính sách bảo mật
- `role-settings` - Developer: Thay đổi role

### Legacy/Demo Screens:
- `demo-navigation` - Demo navigation
- `discovery` - Discovery features
- `my-tasks` - Task management
- `workspace` - Workspace features

## D. Navigation Implementation Status

### ✅ Completed:
- Bottom tab bar configuration with 4 tabs + center FAB
- Dashboard quick actions navigation
- Campaign list → Campaign detail navigation
- Messages → Chat navigation
- Profile menu navigation to all sub-screens
- Notification bell navigation
- Activity items navigation
- Hidden screens configuration

### 🎯 Navigation Flow Examples:

1. **Tạo chiến dịch flow:**
   Dashboard → Nút "Tạo chiến dịch" → `/create-campaign` → Complete → `/campaign-detail-sme`

2. **Quản lý chiến dịch flow:**
   Dashboard → Chiến dịch tab → Select campaign → `/campaign-detail-sme` → KOC profile → `/koc-profile-an`

3. **Tin nhắn flow:**
   Dashboard → Messages tab → Select conversation → `/chat`

4. **Thanh toán flow:**
   Profile → "Phương thức thanh toán" → `/payment-history`

## E. Technical Implementation

### Router Integration:
```typescript
import { useRouter } from 'expo-router';
const router = useRouter();

// Navigation example
router.push('/screen-name' as any);
```

### Icon System:
- Sử dụng `IconSymbol` component với SF Symbols
- Role-based theming with `COLORS` constants
- Gradient support cho FAB và action buttons

### Design Consistency:
- Linear gradients cho SME theme
- Consistent spacing và typography
- Touch feedback với `activeOpacity={0.8}`
- Proper SafeAreaView usage

Luồng navigation này đảm bảo SME có thể dễ dàng quản lý tổng quan, tạo chiến dịch mới, và theo dõi hiệu quả một cách hiệu quả và trực quan.
