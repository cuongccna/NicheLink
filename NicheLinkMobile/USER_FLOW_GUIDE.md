# NicheLink - Hướng Dẫn Quy Trình Sử Dụng & Bố Trí Màn Hình
**Cập nhật: 03/08/2025**

## 📋 Tình Huống Thực Tế: Anh Minh (SME) & Bạn An (KOC)

**Bối cảnh**: Anh Minh (PhinĐen Coffee) muốn thuê KOC An để quảng bá sản phẩm cà phê mới.

---

## 🔄 BƯỚC 1: LỜI MỜI HỢP TÁC

### 📱 **SME Journey - Anh Minh (PhinĐen)**

#### **Màn hình**: `marketplace.tsx` (KOC Marketplace)
**Hành động**:
1. Anh Minh đã tạo chiến dịch "Ra mắt cà phê PhinĐen" 
2. Vào **KOC Marketplace** để tìm kiếm influencer
3. Sử dụng bộ lọc: Category = "Food & Beverage", Location = "TP.HCM"
4. Xem profile card của bạn An với thông tin:
   - ⭐ Rating: 4.8/5
   - 👥 Followers: 85K 
   - 🎯 Specialty: Food & Beverage Review
   - 💰 Rate: ₫800K/post

**Tương tác chính**:
```tsx
// Trên KOC Card
<TouchableOpacity style={styles.inviteButton}>
  <LinearGradient colors={[COLORS.primary, '#00C9B7']}>
    <IconSymbol name="plus.circle.fill" size={16} color="white" />
    <ThemedText style={styles.inviteButtonText}>Mời Hợp tác</ThemedText>
  </LinearGradient>
</TouchableOpacity>
```

**Pop-up Confirmation**:
```
"Bạn có chắc muốn mời An tham gia chiến dịch 'Ra mắt cà phê PhinĐen'?"
[Hủy] [Xác nhận]
```

#### **Kết quả**: 
- System ghi nhận lời mời
- Trạng thái An: "Pending Invitation" 
- Push notification gửi đến An

---

### 📱 **KOC Journey - Bạn An**

#### **Push Notification**:
```
🔔 PhinĐen đã mời bạn tham gia một chiến dịch mới!
```

#### **Màn hình**: `notifications.tsx` (Thông báo)
**Nội dung thông báo**:
- **Type**: `collaboration_invite`
- **Title**: "Lời mời hợp tác mới"  
- **Message**: "PhinĐen đã gửi lời mời tham gia chiến dịch 'Ra mắt cà phê PhinĐen'. Ngân sách: ₫800K"
- **Status**: `unread` (có unread dot)
- **Priority**: `high`

#### **Màn hình**: `explore.tsx` (KOC Feed)
**Campaign Card được highlight**:
```tsx
// Lời mời mới sẽ có badge đặc biệt
<View style={styles.newInviteBadge}>
  <IconSymbol name="star.fill" size={12} color={COLORS.warning} />
  <ThemedText style={styles.newInviteText}>Lời mời mới</ThemedText>
</View>
```

#### **Navigation**: An tap vào thông báo → Điều hướng đến `campaign-detail-koc.tsx`

---

## 🔄 BƯỚC 2: CHẤP NHẬN LỜI MỜI & BẮT ĐẦU TRAO ĐỔI

### 📱 **KOC Journey - Bạn An**

#### **Màn hình**: `campaign-detail-koc.tsx` (Chi tiết Chiến dịch KOC)
**Thông tin hiển thị**:
- **Campaign Title**: "Ra mắt cà phê PhinĐen"
- **Brand**: PhinĐen Coffee (verified badge)
- **Payment**: ₫800,000
- **Deadline**: 15 ngày
- **Deliverables**: 
  - 1 video TikTok review (60s)
  - 2 Instagram posts 
  - 5 Instagram stories

**Application Button**:
```tsx
// Trạng thái: Invited (chưa accept)
<TouchableOpacity style={styles.acceptInviteButton}>
  <LinearGradient colors={[COLORS.success, '#4CAF50']}>
    <IconSymbol name="checkmark.circle.fill" size={20} color="white" />
    <ThemedText style={styles.acceptButtonText}>Chấp nhận Lời mời</ThemedText>
  </LinearGradient>
</TouchableOpacity>
```

**Hành động**: An nhấn "Chấp nhận Lời mời"

#### **System Events**:
1. Cập nhật trạng thái: `invited` → `accepted`
2. Tạo chat channel giữa Minh & An
3. Tạo Creative Workspace cho An
4. Push notification gửi đến Anh Minh

---

### 📱 **SME Journey - Anh Minh (PhinĐen)**

#### **Push Notification**:
```
✅ An đã chấp nhận lời mời tham gia chiến dịch của bạn!
```

#### **Màn hình**: `campaign-detail.tsx` (Chi tiết Chiến dịch SME)
**KOC Status Update**:
```tsx
// Trong danh sách KOC
<View style={styles.kocItem}>
  <View style={styles.kocInfo}>
    <ThemedText style={styles.kocName}>An Nguyễn</ThemedText>
    <View style={[styles.statusBadge, {backgroundColor: COLORS.success + '15'}]}>
      <ThemedText style={[styles.statusText, {color: COLORS.success}]}>
        Đã chấp nhận
      </ThemedText>
    </View>
  </View>
  
  <TouchableOpacity style={styles.chatButton}>
    <IconSymbol name="message.fill" size={16} color={COLORS.primary} />
    <ThemedText style={styles.chatButtonText}>Chat</ThemedText>
  </TouchableOpacity>
</View>
```

**Navigation**: Anh Minh tap "Chat" → Điều hướng đến `chat.tsx`

---

## 🔄 BƯỚC 3: GIAO TIẾP & THỰC HIỆN

### 📱 **Chat Interface** - `chat.tsx`

#### **Initial System Message**:
```tsx
{
  type: 'system',
  content: "Cuộc trò chuyện về chiến dịch 'Ra mắt cà phê PhinĐen' đã được bắt đầu"
}
```

#### **Sample Conversation**:
```tsx
// SME Message
{
  type: 'text',
  sender: 'sme',
  content: "Chào An! Cảm ơn bạn đã chấp nhận tham gia chiến dịch. Tôi sẽ gửi brief chi tiết và sản phẩm sample."
}

// File Attachment từ SME
{
  type: 'file',
  sender: 'sme',
  fileName: "Brief_PhinDen_Campaign.pdf",
  fileSize: "2.1 MB"
}

// KOC Response
{
  type: 'text',
  sender: 'koc', 
  content: "Chào anh Minh! Em rất hào hứng được hợp tác với PhinĐen. Em sẽ xem brief và phản hồi sớm nhất."
}
```

---

### 📱 **KOC Workspace** - `creative-workspace.tsx`

#### **Sau khi nhận sản phẩm, An vào Workspace**:

**Tab "Overview"**:
- Campaign progress: 25% complete
- Upcoming deadline: Video TikTok (còn 8 ngày)
- Next milestone payment: ₫400,000

**Tab "Checklist"**:
```tsx
// Interactive checklist
const deliverables = [
  { id: 1, task: "Nhận sản phẩm sample", status: "completed" },
  { id: 2, task: "Tạo video TikTok review", status: "in_progress" },
  { id: 3, task: "Post Instagram stories", status: "pending" },
  { id: 4, task: "Upload Instagram posts", status: "pending" }
];
```

**Tab "Content"** - Upload Interface:
```tsx
<TouchableOpacity style={styles.uploadButton}>
  <LinearGradient colors={[COLORS.primary, '#00C9B7']}>
    <IconSymbol name="arrow.up.circle.fill" size={20} color="white" />
    <ThemedText style={styles.uploadText}>Tải lên Video TikTok</ThemedText>
  </LinearGradient>
</TouchableOpacity>
```

**Hành động**: An upload video và nhấn "Gửi để duyệt"

---

## 🔄 BƯỚC 4: DUYỆT NỘI DUNG

### 📱 **SME Journey - Anh Minh**

#### **Push Notification**:
```
⚠️ An đã gửi nội dung cho chiến dịch. Vui lòng duyệt.
```

#### **Màn hình**: `campaign-detail.tsx`
**KOC Status Update**:
```tsx
<View style={[styles.statusBadge, {backgroundColor: COLORS.warning + '15'}]}>
  <ThemedText style={[styles.statusText, {color: COLORS.warning}]}>
    Cần duyệt
  </ThemedText>
</View>

<TouchableOpacity style={styles.reviewButton}>
  <IconSymbol name="eye.fill" size={16} color={COLORS.primary} />
  <ThemedText style={styles.reviewButtonText}>Duyệt nội dung</ThemedText>
</TouchableOpacity>
```

#### **Màn hình**: `content-review.tsx` (Duyệt Nội dung)
**Content Preview**:
```tsx
// Video player placeholder
<View style={styles.videoPreview}>
  <IconSymbol name="play.circle.fill" size={64} color={COLORS.primary} />
  <ThemedText style={styles.videoTitle}>phinден_coffee_review.mp4</ThemedText>
</View>

// Approval actions
<View style={styles.approvalActions}>
  <TouchableOpacity style={styles.approveButton}>
    <LinearGradient colors={[COLORS.success, '#4CAF50']}>
      <IconSymbol name="checkmark.circle.fill" size={20} color="white" />
      <ThemedText style={styles.approveText}>Phê duyệt</ThemedText>
    </LinearGradient>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.rejectButton}>
    <ThemedText style={styles.rejectText}>Yêu cầu chỉnh sửa</ThemedText>
  </TouchableOpacity>
</View>
```

**Hành động**: Anh Minh xem video và nhấn "Phê duyệt"

---

## 🔄 BƯỚC 5: HOÀN THÀNH & THANH TOÁN

### 📱 **Final Delivery & Completion**

#### **KOC** - An đăng content công khai và báo cáo:
```tsx
// Trong Creative Workspace - Tab "Content"
<TouchableOpacity style={styles.submitFinalButton}>
  <ThemedText style={styles.submitFinalText}>Gửi báo cáo cuối cùng</ThemedText>
</TouchableOpacity>
```

#### **SME** - Anh Minh xác nhận hoàn thành:
```tsx
// Trong Campaign Detail
<TouchableOpacity style={styles.completeButton}>
  <LinearGradient colors={[COLORS.success, '#4CAF50']}>
    <IconSymbol name="checkmark.seal.fill" size={20} color="white" />
    <ThemedText style={styles.completeText}>Xác nhận Hoàn thành</ThemedText>
  </LinearGradient>
</TouchableOpacity>
```

**Confirmation Modal**:
```
"Hành động này sẽ giải ngân ₫800,000 cho An từ tài khoản đảm bảo của bạn. Bạn chắc chắn chứ?"
[Hủy] [Xác nhận]
```

---

### 📱 **Payment Processing**

#### **System Events**:
1. Chuyển tiền từ escrow account → KOC wallet
2. Cập nhật campaign status: `completed`
3. Gửi notifications cho cả hai bên

#### **KOC Notifications**:
```
✅ PhinĐen đã xác nhận bạn hoàn thành nhiệm vụ!
💰 Bạn đã nhận được ₫800,000 vào ví NicheLink!
```

#### **Màn hình**: `koc-wallet.tsx` (Ví KOC)
**Balance Update**:
```tsx
// Wallet card với updated balance
<ThemedText style={styles.walletBalance}>
  ₫4,250,000 {/* Số dư mới */}
</ThemedText>

// Transaction history
<View style={styles.earningItem}>
  <View style={[styles.earningIcon, {backgroundColor: COLORS.success + '15'}]}>
    <IconSymbol name="checkmark.circle.fill" size={24} color={COLORS.success} />
  </View>
  <View style={styles.earningInfo}>
    <ThemedText style={styles.earningTitle}>Hoàn thành chiến dịch</ThemedText>
    <ThemedText style={styles.earningCampaign}>Ra mắt cà phê PhinĐen • PhinĐen Coffee</ThemedText>
  </View>
  <ThemedText style={[styles.earningAmount, {color: COLORS.success}]}>
    +₫800,000
  </ThemedText>
</View>
```

#### **Màn hình**: `my-tasks.tsx` (Nhiệm vụ của tôi)
**Task Status Update**:
```tsx
// Task tự động chuyển sang tab "Completed"
<View style={[styles.taskCard, styles.completedTask]}>
  <View style={[styles.taskStatus, {backgroundColor: COLORS.success + '15'}]}>
    <ThemedText style={[styles.taskStatusText, {color: COLORS.success}]}>
      Hoàn thành
    </ThemedText>
  </View>
</View>
```

---

## 🔄 BƯỚC 6: ĐÁNH GIÁ LẪN NHAU

### 📱 **Mutual Rating System**

#### **System Events**:
- Sau 24h hoàn thành, system tự động tạo rating requests
- Gửi thông báo cho cả hai bên

#### **Notification Content**:
```tsx
{
  type: 'system_update',
  title: 'Đánh giá đối tác',
  message: 'Hãy để lại đánh giá cho đối tác của bạn để xây dựng cộng đồng NicheLink tin cậy hơn.',
  actionRequired: true
}
```

#### **Rating Interface** (New Modal/Screen):
```tsx
// Rating modal
<View style={styles.ratingModal}>
  <ThemedText style={styles.ratingTitle}>Đánh giá hợp tác</ThemedText>
  
  {/* Star rating */}
  <View style={styles.starRating}>
    {[1,2,3,4,5].map(star => (
      <TouchableOpacity key={star} onPress={() => setRating(star)}>
        <IconSymbol 
          name={star <= rating ? "star.fill" : "star"} 
          size={32} 
          color={star <= rating ? COLORS.warning : COLORS.light.border} 
        />
      </TouchableOpacity>
    ))}
  </View>
  
  {/* Comment box */}
  <TextInput 
    style={styles.commentInput}
    placeholder="Chia sẻ trải nghiệm hợp tác của bạn..."
    multiline
  />
  
  <TouchableOpacity style={styles.submitRatingButton}>
    <ThemedText style={styles.submitRatingText}>Gửi đánh giá</ThemedText>
  </TouchableOpacity>
</View>
```

---

## 📊 NAVIGATION FLOW SUMMARY

### **Quy trình Màn hình cho SME (Anh Minh)**:
1. `marketplace.tsx` → Tìm & mời KOC
2. `campaign-detail.tsx` → Quản lý campaign & KOC
3. `chat.tsx` → Giao tiếp với KOC
4. `content-review.tsx` → Duyệt nội dung
5. `campaign-detail.tsx` → Xác nhận hoàn thành
6. `notifications.tsx` → Nhận thông báo rating

### **Quy trình Màn hình cho KOC (Bạn An)**:
1. `notifications.tsx` → Nhận lời mời
2. `campaign-detail-koc.tsx` → Xem chi tiết & chấp nhận
3. `chat.tsx` → Giao tiếp với SME  
4. `creative-workspace.tsx` → Làm việc & upload content
5. `koc-wallet.tsx` → Nhận thanh toán
6. `my-tasks.tsx` → Theo dõi trạng thái task

### **Cross-Platform Features**:
- `notifications.tsx` - Hub cho tất cả updates
- `chat.tsx` - Communication channel
- Push notifications - Real-time alerts
- Rating system - Trust building

---

## 🎯 KEY DESIGN PATTERNS

### **Color Coding theo Context**:
- **Teal (#00A79D)**: Primary actions (Invite, Accept, Chat)
- **Success Green (#4CAF50)**: Completed states, payments
- **Warning Yellow (#FFC107)**: Pending reviews, deadlines
- **Peach Orange (#FF8A65)**: New invitations, highlights

### **Status Flow Progression**:
```
Invited → Accepted → In Progress → Content Submitted → 
Content Approved → Completed → Paid → Rated
```

### **Notification Types theo Tình huống**:
- `collaboration_invite` - Lời mời hợp tác
- `content_approved` - Nội dung được duyệt  
- `payment_received` - Thanh toán thành công
- `campaign_completed` - Hoàn thành chiến dịch
- `rating_request` - Yêu cầu đánh giá

**Tất cả các màn hình đã được thiết kế để hỗ trợ quy trình này một cách seamless và intuitive! 🚀**
