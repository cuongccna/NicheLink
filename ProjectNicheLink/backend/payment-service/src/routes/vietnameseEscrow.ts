import express from 'express';
import { 
  VietnameseEscrowManager, 
  BaoKimService, 
  NganLuongService,
  createVietnameseEscrowManager,
  KOCEscrowParams
} from '../services';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Initialize Vietnamese Escrow services
const baoKimConfig = {
  merchantId: process.env.BAOKIM_MERCHANT_ID || '',
  securePass: process.env.BAOKIM_SECURE_PASS || '',
  apiUrl: process.env.BAOKIM_API_URL || 'https://sandbox.baokim.vn/payment/api/v5',
  escrowApiUrl: process.env.BAOKIM_ESCROW_API_URL || 'https://sandbox.baokim.vn/payment/api/v5/escrow',
  returnUrl: process.env.BAOKIM_RETURN_URL || 'http://localhost:3000/payment/return',
  ipnUrl: process.env.BAOKIM_IPN_URL || 'http://localhost:3001/api/vietnamese-escrow/baokim/ipn'
};

const nganLuongConfig = {
  merchantId: process.env.NGANLUONG_MERCHANT_ID || '',
  securePass: process.env.NGANLUONG_SECURE_PASS || '',
  apiUrl: process.env.NGANLUONG_API_URL || 'https://sandbox.nganluong.vn:8088/nl35/api.php',
  escrowApiUrl: process.env.NGANLUONG_ESCROW_API_URL || 'https://sandbox.nganluong.vn:8088/nl35/escrow.php',
  returnUrl: process.env.NGANLUONG_RETURN_URL || 'http://localhost:3000/payment/return',
  ipnUrl: process.env.NGANLUONG_IPN_URL || 'http://localhost:3001/api/vietnamese-escrow/nganluong/ipn'
};

const baoKimService = new BaoKimService(baoKimConfig);
const nganLuongService = new NganLuongService(nganLuongConfig);
const vietnameseEscrowManager = createVietnameseEscrowManager(baoKimService, nganLuongService);

// ========== KOC ESCROW APIs ==========

// POST /api/vietnamese-escrow/koc-campaign - Tạo escrow cho KOC campaign
router.post('/koc-campaign', authMiddleware, async (req, res): Promise<void> => {
  try {
    const kocEscrowParams: KOCEscrowParams = req.body;

    // Validate required fields
    if (!kocEscrowParams.orderId || !kocEscrowParams.amount) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, amount'
      });
      return;
    }

    if (!kocEscrowParams.smeInfo.email || !kocEscrowParams.kocInfo.email) {
      res.status(400).json({
        success: false,
        message: 'Missing SME or KOC contact information'
      });
      return;
    }

    console.log(`Creating KOC escrow for campaign: ${kocEscrowParams.campaignDetails.title}`);
    console.log(`Amount: ${kocEscrowParams.amount.toLocaleString('vi-VN')} VND`);
    
    const result = await vietnameseEscrowManager.createKOCEscrow(kocEscrowParams);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('KOC escrow creation failed:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/vietnamese-escrow/release - Release funds từ escrow
router.post('/release', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { escrowId, orderId, releaseAmount, releaseReason, provider } = req.body;

    if (!escrowId || !orderId || !releaseAmount || !provider) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: escrowId, orderId, releaseAmount, provider'
      });
      return;
    }

    console.log(`Releasing escrow funds: ${releaseAmount.toLocaleString('vi-VN')} VND via ${provider}`);
    
    const result = await vietnameseEscrowManager.releaseEscrow({
      escrowId,
      orderId,
      releaseAmount,
      releaseReason: releaseReason || 'Milestone completed',
      provider
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Escrow release failed:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/vietnamese-escrow/refund - Refund funds từ escrow
router.post('/refund', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { escrowId, orderId, refundAmount, refundReason, provider } = req.body;

    if (!escrowId || !orderId || !refundAmount || !provider) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: escrowId, orderId, refundAmount, provider'
      });
      return;
    }

    console.log(`Refunding escrow funds: ${refundAmount.toLocaleString('vi-VN')} VND via ${provider}`);
    
    const result = await vietnameseEscrowManager.refundEscrow({
      escrowId,
      orderId,
      refundAmount,
      refundReason: refundReason || 'Campaign cancelled',
      provider
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Escrow refund failed:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/vietnamese-escrow/status/:provider/:escrowId/:orderId - Query escrow status
router.get('/status/:provider/:escrowId/:orderId', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { provider, escrowId, orderId } = req.params;

    if (!provider || !escrowId || !orderId) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: provider, escrowId, orderId'
      });
      return;
    }

    if (!['BAOKIM', 'NGANLUONG'].includes(provider.toUpperCase())) {
      res.status(400).json({
        success: false,
        message: 'Invalid provider. Must be BAOKIM or NGANLUONG'
      });
      return;
    }

    console.log(`Querying escrow status: ${escrowId} via ${provider}`);
    
    const result = await vietnameseEscrowManager.queryEscrowStatus(
      escrowId, 
      orderId, 
      provider.toUpperCase() as 'BAOKIM' | 'NGANLUONG'
    );

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Escrow status query failed:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========== IPN WEBHOOKS ==========

// POST /api/vietnamese-escrow/baokim/ipn - Bảo Kim IPN webhook
router.post('/baokim/ipn', async (req, res) => {
  try {
    console.log('Received Bảo Kim IPN:', req.body);
    
    const verification = await vietnameseEscrowManager.verifyIPN(req.body, 'BAOKIM');
    
    if (verification.isValid) {
      console.log('Bảo Kim IPN verified successfully:', verification.transactionData);
      
      // TODO: Update database với transaction data
      // await updateEscrowTransaction(verification.transactionData);
      
      res.status(200).send('OK');
    } else {
      console.error('Bảo Kim IPN verification failed');
      res.status(400).send('INVALID');
    }

  } catch (error: any) {
    console.error('Bảo Kim IPN processing failed:', error);
    res.status(500).send('ERROR');
  }
});

// POST /api/vietnamese-escrow/nganluong/ipn - Ngân Lượng IPN webhook
router.post('/nganluong/ipn', async (req, res) => {
  try {
    console.log('Received Ngân Lượng IPN:', req.body);
    
    const verification = await vietnameseEscrowManager.verifyIPN(req.body, 'NGANLUONG');
    
    if (verification.isValid) {
      console.log('Ngân Lượng IPN verified successfully:', verification.transactionData);
      
      // TODO: Update database với transaction data
      // await updateEscrowTransaction(verification.transactionData);
      
      res.status(200).send('OK');
    } else {
      console.error('Ngân Lượng IPN verification failed');
      res.status(400).send('INVALID');
    }

  } catch (error: any) {
    console.error('Ngân Lượng IPN processing failed:', error);
    res.status(500).send('ERROR');
  }
});

// ========== SYSTEM STATUS APIs ==========

// GET /api/vietnamese-escrow/health - Health check của cả 2 providers
router.get('/health', authMiddleware, async (req, res) => {
  try {
    const health = await vietnameseEscrowManager.getProvidersHealth();
    
    const overallStatus = health.primary.status === 'UP' || health.backup.status === 'UP' ? 'UP' : 'DOWN';
    
    res.json({
      success: true,
      status: overallStatus,
      providers: health,
      recommendations: {
        primaryProvider: health.primary.status === 'UP' ? 'AVAILABLE' : 'USE_BACKUP',
        backupProvider: health.backup.status === 'UP' ? 'AVAILABLE' : 'DOWN'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/vietnamese-escrow/supported-banks/:provider - Lấy danh sách ngân hàng
router.get('/supported-banks/:provider', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { provider } = req.params;
    
    if (!provider || !['baokim', 'nganluong'].includes(provider.toLowerCase())) {
      res.status(400).json({
        success: false,
        message: 'Invalid provider. Must be baokim or nganluong'
      });
      return;
    }

    let result;
    if (provider.toLowerCase() === 'baokim') {
      // Use a generic method name that exists in BaoKimService
      result = await baoKimService.getSupportedBanks();
    } else {
      result = await nganLuongService.getSupportedBanks();
    }

    res.json({
      success: true,
      provider: provider.toUpperCase(),
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const { provider } = req.params;
    console.error(`${provider || 'unknown'} banks query failed:`, error);
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/vietnamese-escrow/fees/:provider - Tính phí giao dịch
router.get('/fees/:provider', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { provider } = req.params;
    const { amount, paymentMethod } = req.query;
    
    if (!provider || !['baokim', 'nganluong'].includes(provider.toLowerCase())) {
      res.status(400).json({
        success: false,
        message: 'Invalid provider. Must be baokim or nganluong'
      });
      return;
    }

    if (!amount) {
      res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
      return;
    }

    const amountNum = parseInt(amount as string);
    let feeCalculation;

    if (provider.toLowerCase() === 'baokim') {
      feeCalculation = baoKimService.calculateFee(amountNum, paymentMethod as string);
    } else {
      feeCalculation = nganLuongService.calculateFee(amountNum, paymentMethod as string);
    }

    res.json({
      success: true,
      provider: provider.toUpperCase(),
      amount: amountNum,
      paymentMethod: paymentMethod || 'DEFAULT',
      fees: feeCalculation,
      totalAmount: amountNum + feeCalculation.totalFee,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const { provider } = req.params;
    console.error(`${provider || 'unknown'} fee calculation failed:`, error);
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
