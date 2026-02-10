import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { generateMoodSuggestion } from '../services/aiService.js';

const router = Router();

router.use(authenticate);

router.post('/mood-suggestion', async (req, res) => {
  try {
    const { category, title, description } = req.body;

    if (!category || !title) {
      return res.status(400).json({
        success: false,
        message: 'Category and title are required'
      });
    }

    const suggestion = await generateMoodSuggestion({ category, title, description });

    res.json({
      success: true,
      data: {
        suggestion
      }
    });
  } catch (error) {
    console.error('[AI ROUTES] Mood suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate mood suggestion'
    });
  }
});

router.get('/simple-insights', async (req, res, next) => {
  try {
    const { generateSimpleInsights } = await import('../services/aiService.js');
    const insights = await generateSimpleInsights({
      avgMood: parseFloat(req.query.avgMood) || 0,
      avgStress: req.query.avgStress ? parseFloat(req.query.avgStress) : null,
      avgEnergy: req.query.avgEnergy ? parseFloat(req.query.avgEnergy) : null,
      totalActivities: parseInt(req.query.totalActivities) || 0,
      moodTrend: req.query.moodTrend || null,
      stressTrend: req.query.stressTrend || null
    });
    res.json({ success: true, data: { insights } });
  } catch (error) {
    next(error);
  }
});

export default router;
