import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { createClient } from 'redis';
import { prisma } from './lib/prisma';

// Import routes
import escrowRoutes from './routes/escrow';
import paymentRoutes from './routes/payment';
import walletRoutes from './routes/wallet';
import disputeRoutes from './routes/dispute';
import notificationRoutes from './routes/notification';
import webhookRoutes from './routes/webhook';
import adminRoutes from './routes/admin';
import vietnameseEscrowRoutes from './routes/vietnameseEscrow';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';

// Import services
import { initializeStripe } from './services/stripe';
import { initializePayPal } from './services/paypal';
import { initializeWeb3 } from './services/blockchain';
import VNPayService from './services/vnpay';
import MoMoService from './services/momo';
import DisputeService from './services/dispute';
import AutoReleaseService from './services/autoRelease';
import EscrowWalletService from './services/escrowWallet';
import TransactionHistoryService from './services/transactionHistory';

config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize database and cache
const redis = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  database: parseInt(process.env.REDIS_DB || '0')
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet());
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/escrow', authMiddleware, escrowRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/wallets', authMiddleware, walletRoutes);
app.use('/api/disputes', authMiddleware, disputeRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/webhooks', webhookRoutes); // Webhooks don't need auth middleware
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/vietnamese-escrow', vietnameseEscrowRoutes); // Vietnamese Escrow APIs (IPN endpoints no auth)

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Initialize services
async function initializeServices() {
  try {
    // Initialize database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Initialize Redis
    await redis.connect();
    console.log('✅ Redis connected');

    // Initialize payment providers
    await initializeStripe();
    console.log('✅ Stripe initialized');

    await initializePayPal();
    console.log('✅ PayPal initialized');

    // Initialize VNPay
    const vnpayService = new VNPayService();
    console.log('✅ VNPay initialized');

    // Initialize MoMo
    const momoService = new MoMoService();
    console.log('✅ MoMo initialized');

    // Initialize Escrow Services
    const disputeService = new DisputeService(prisma);
    console.log('✅ Dispute Service initialized');

    const autoReleaseService = new AutoReleaseService(prisma);
    console.log('✅ Auto-Release Service initialized');

    const escrowWalletService = new EscrowWalletService(prisma);
    console.log('✅ Escrow Wallet Service initialized');

    const transactionHistoryService = new TransactionHistoryService(prisma);
    console.log('✅ Transaction History Service initialized');

    if (process.env.ENABLE_CRYPTO_PAYMENTS === 'true') {
      await initializeWeb3();
      console.log('✅ Web3 initialized');
    }

    console.log('🚀 All payment services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  await prisma.$disconnect();
  await redis.disconnect();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  await prisma.$disconnect();
  await redis.disconnect();
  
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`🚀 Payment Service running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, prisma, redis };
