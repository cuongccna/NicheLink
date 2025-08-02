import { Router } from 'express';
import { recommendationController } from '@/controllers/recommendationController';

const router = Router();

// Recommendation routes
router.post('/generate', recommendationController.generateRecommendations.bind(recommendationController));
router.get('/:campaignId/:influencerId/explanation', recommendationController.getRecommendationExplanation.bind(recommendationController));
router.get('/health', recommendationController.healthCheck.bind(recommendationController));

export default router;
