import { Router } from 'express';

const router = Router();

// Placeholder routes - to be implemented
router.post('/stripe', (req, res) => {
  res.json({ message: 'Stripe webhook - Coming soon' });
});

router.post('/paypal', (req, res) => {
  res.json({ message: 'PayPal webhook - Coming soon' });
});

export default router;
