# Luồng Điều Hướng KOC - NicheLink Mobile

## Tổng Quan
Logic Navigation cho người dùng KOC được thiết kế với mục tiêu: **Tìm cơ hội**, **Quản lý công việc**, và **Xây dựng hồ sơ**.

## A. Thanh Điều Hướng Dưới Cùng (Bottom Tab Bar)

### 4 Tab Chính:

1. **🧭 Bảng tin (Feed)** - `index.tsx` (for KOC)
   - Icon: `safari.fill`
   - Nơi khám phá các cơ hội/nhiệm vụ mới

2. **☑️ Nhiệm vụ** - `my-tasks.tsx`
   - Icon: `checklist`
   - Trung tâm quản lý các công việc đã nhận

3. **💬 Tin nhắn** - `messages.tsx`
   - Icon: `message.fill`
   - Quản lý tất cả các cuộc hội thoại

4. **👤 Hồ sơ** - `koc-profile.tsx`
   - Icon: `person.fill`
   - Quản lý hồ sơ, portfolio và thu nhập

## B. Luồng Điều Hướng Chi Tiết

### 1. 🧭 Từ Tab Bảng tin (Feed)

#### Navigation Functions Implemented:
```typescript
const navigateToCampaignDetailKOC = (campaignId: string) => {
  router.push('/campaign-detail-koc' as any);
};

const navigateToCompanyProfile = (companyId: string) => {
  router.push('/company-profile' as any);
};

const navigateToNotifications = () => {
  router.push('/notifications' as any);
};
```

#### Tương Tác Với Nhiệm Vụ:
- **Thẻ nhiệm vụ** → Click "Xem chi tiết" → `/campaign-detail-koc`
- **Logo/tên thương hiệu** → Click → `/company-profile`
- **Nút "Ứng tuyển"** → Pop-up xác nhận → Trạng thái "Đã ứng tuyển"

#### Khám Phá & Tìm Kiếm:
- **Search bar** → Tìm kiếm chiến dịch theo từ khóa
- **Filter buttons** → Lọc theo category/budget/timeline
- **Notification bell** → `/notifications`

### 2. ☑️ Từ Tab Nhiệm vụ

#### Tab Con (Secondary Navigation):
- **"Đang thực hiện"** - Tasks with status: 'in_progress'
- **"Chờ duyệt"** - Tasks with status: 'pending' 
- **"Đã hoàn thành"** - Tasks with status: 'completed'

#### Navigation trong Task Management:
```typescript
const navigateToWorkspace = (taskId: string) => {
  router.push('/creative-workspace' as any);
};

const navigateToChat = (taskId: string) => {
  router.push('/chat' as any);
};
```

#### Phòng Làm Việc (Creative Workspace):
- **Click nhiệm vụ** → Điều hướng đến `/creative-workspace`
- **Trong workspace:**
  - **"Chat với SME"** → `/chat` (với SME cụ thể)
  - **"Tải lên nội dung"** → File picker system interface
  - **Progress tracking** → Real-time task completion status
  - **Requirement checklist** → Interactive todo list

### 3. 💬 Từ Tab Tin nhắn

#### Conversation Management:
```typescript
const navigateToChat = (conversationId: string) => {
  router.push('/chat' as any);
};
```

#### Features (Tương tự SME):
- **Danh sách cuộc hội thoại** với filter (Tất cả/Chưa đọc/Doanh nghiệp)
- **Search conversations** by name or message content
- **Role-based header** → "Tin nhắn với Doanh nghiệp"
- **Click conversation** → Điều hướng đến `/chat`

### 4. 👤 Từ Tab Hồ sơ

#### Profile Management Navigation:
```typescript
const navigateToProfileEdit = () => {
  router.push('/profile-edit' as any);
};

const navigateToWallet = () => {
  router.push('/koc-wallet' as any);
};

const navigateToPortfolioManagement = () => {
  router.push('/portfolio-management' as any);
};

const navigateToMyReviews = () => {
  router.push('/my-reviews' as any);
};

const navigateToSettings = () => {
  router.push('/settings' as any);
};
```

#### Quản Lý Hồ Sơ Section:
- **"Chỉnh sửa Hồ sơ"** → `/profile-edit`
  - Cập nhật thông tin cá nhân, bio, specialties
  - Quản lý social media links
  - Upload avatar & cover image

- **"Ví tiền / Thu nhập"** → `/koc-wallet`
  - Lịch sử thu nhập từ campaigns
  - Pending payments tracking
  - Withdrawal requests
  - Payment methods management

- **"Quản lý Portfolio"** → `/portfolio-management`
  - Thêm/sửa/xóa dự án mẫu
  - Upload content samples
  - Organize by categories
  - Performance metrics per content

- **"Đánh giá của tôi"** → `/my-reviews`
  - Reviews từ các SME
  - Rating breakdown
  - Feedback history
  - Response to reviews

- **"Cài đặt"** → `/settings`
  - Notification preferences
  - Privacy settings
  - Account management
  - App preferences

#### Profile Display Features:
- **Tab Navigation**: Tổng quan, Portfolio, Đánh giá, Thống kê
- **Social media stats** với platform switching
- **Collaboration quick actions** (for viewing other profiles)
- **Achievement showcase**
- **Specialties & story display**

## C. Hidden Screens (Accessible via Navigation)

Các màn hình sau được configured trong `_layout.tsx` với `{ href: null }`:

### Core KOC Screens:
- `chat` - Chi tiết cuộc trò chuyện
- `campaign-detail-koc` - Chi tiết chiến dịch cho KOC (view khác SME)
- `creative-workspace` - Phòng làm việc sáng tạo
- `koc-wallet` - Ví tiền và quản lý thu nhập
- `company-profile` - Hồ sơ doanh nghiệp/thương hiệu

### Management Screens:
- `profile-edit` - Chỉnh sửa hồ sơ KOC
- `portfolio-management` - Quản lý portfolio content
- `my-reviews` - Đánh giá từ SME
- `notifications` - Danh sách thông báo
- `settings` - Cài đặt ứng dụng

### Legacy Screens (Hidden from KOC):
- `profile` - SME profile (hidden với href: null)
- `campaigns` - SME campaign management
- `create-campaign` - SME campaign creation

## D. Navigation Implementation Status

### ✅ Completed:
- Bottom tab bar với 4 tabs chính cho KOC
- Feed/Discovery với campaign detail navigation
- Company profile navigation từ brand info
- My Tasks với creative workspace navigation  
- KOC Profile với full management section
- Messages integration (shared với SME)
- Hidden screens configuration

### 🎯 KOC Navigation Flow Examples:

1. **Tìm cơ hội flow:**
   Feed → Browse campaigns → "Xem chi tiết" → `/campaign-detail-koc` → "Ứng tuyển" → Confirmation

2. **Quản lý công việc flow:**
   Nhiệm vụ → Select active task → `/creative-workspace` → Upload content → Chat với SME

3. **Xây dựng hồ sơ flow:**
   Hồ sơ → "Quản lý Portfolio" → `/portfolio-management` → Add new content samples

4. **Thu nhập flow:**
   Hồ sơ → "Ví tiền / Thu nhập" → `/koc-wallet` → View earnings & payment history

## E. Technical Implementation

### Role-Based Routing:
```typescript
// Trong _layout.tsx
if (user?.role === 'SME') {
  // SME navigation structure
} else {
  // KOC navigation structure (default)
}
```

### KOC-Specific Features:
- **Creative Workspace** → Comprehensive content creation & submission
- **Portfolio Management** → Content showcase with performance tracking  
- **Wallet Integration** → Income tracking & payment management
- **Application System** → Campaign application với confirmation flows

### Design Consistency:
- **Secondary color theming** (cam/FFAB91) cho KOC vs primary (xanh) cho SME
- **Tab icons** phù hợp với workflow: Safari (discovery), Checklist (tasks), Message, Person
- **Navigation patterns** consistent với industry standards
- **Touch feedback** và responsive design

### Future Enhancements:
- **Push notifications** cho campaign opportunities
- **Advanced filtering** trong Feed
- **Content analytics** trong Portfolio
- **Real-time collaboration** trong Creative Workspace

Luồng navigation này đảm bảo KOC có thể dễ dàng **tìm cơ hội mới**, **quản lý công việc hiệu quả**, và **xây dựng hồ sơ chuyên nghiệp** một cách trực quan và user-friendly.
