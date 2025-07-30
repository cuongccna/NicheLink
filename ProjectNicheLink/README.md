# NicheLink - Nền tảng kết nối Micro-influencer và SMEs

## Tổng quan dự án
NicheLink là nền tảng kết nối micro-influencer với doanh nghiệp nhỏ, tập trung vào nano/micro-influencer với chi phí hợp lý và hiệu quả cao.

## Kiến trúc dự án

### Giai đoạn 1: Mobile App (MVP)
- **Frontend**: React Native (iOS & Android)
- **Backend**: Node.js với kiến trúc Microservices
- **Database**: PostgreSQL + MongoDB
- **Authentication**: Firebase Auth
- **Cloud**: Google Cloud Platform

### Cấu trúc thư mục
```
ProjectNicheLink/
├── mobile-app/          # React Native App
├── backend/             # Backend Microservices
│   ├── auth-service/    # Authentication & User Management
│   ├── campaign-service/ # Campaign Management
│   ├── messaging-service/ # Chat & Notifications
│   ├── payment-service/ # Payment & Billing
│   └── analytics-service/ # Analytics & Reporting
├── shared/              # Shared utilities & types
├── docs/                # Documentation
└── deploy/              # Deployment configs
```

## Tech Stack

### Mobile App
- **Framework**: React Native 0.74+
- **Navigation**: React Navigation 6
- **State Management**: Redux Toolkit + RTK Query
- **UI Library**: NativeBase / React Native Elements
- **Styling**: Styled Components

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js + NestJS
- **Database**: PostgreSQL (transactions) + MongoDB (content)
- **Authentication**: Firebase Admin SDK
- **API Gateway**: Express Gateway
- **Message Queue**: Redis + Bull Queue

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose (dev) → Kubernetes (prod)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana

## Giai đoạn phát triển

### Sprint 1-2: Cơ sở hạ tầng (2-3 tuần)
- [x] Project setup & structure
- [ ] Backend microservices setup
- [ ] Database configuration
- [ ] Firebase Authentication setup
- [ ] Mobile app initialization

### Sprint 3-4: Authentication & User Management (2-3 tuần)
- [ ] User registration/login flows
- [ ] SME vs Influencer onboarding
- [ ] Profile management
- [ ] Role-based access control

### Sprint 5-6: Marketplace Core (3-4 tuần)
- [ ] Campaign creation (SMEs)
- [ ] Campaign discovery (Influencers)
- [ ] Filtering & search
- [ ] Application & acceptance flow

### Sprint 7-8: Communication (2-3 tuần)
- [ ] In-app messaging
- [ ] Push notifications
- [ ] File sharing
- [ ] Status updates

### Sprint 9-10: Payments & Analytics (3-4 tuần)
- [ ] VNPay/MoMo integration
- [ ] Analytics dashboard
- [ ] Performance tracking
- [ ] Revenue management

## Bắt đầu phát triển

1. **Setup môi trường**:
   ```bash
   # Backend
   cd backend
   npm install
   npm run dev

   # Mobile App
   cd mobile-app
   npm install
   npx react-native run-android
   npx react-native run-ios
   ```

2. **Database setup**:
   ```bash
   docker-compose up -d postgres mongodb redis
   ```

3. **Environment variables**:
   Copy `.env.example` to `.env` và cấu hình các biến môi trường cần thiết.

## Đóng góp
Vui lòng đọc [CONTRIBUTING.md](./docs/CONTRIBUTING.md) để biết thêm chi tiết về quy trình phát triển.

## License
MIT License - xem [LICENSE](./LICENSE) để biết thêm chi tiết.
