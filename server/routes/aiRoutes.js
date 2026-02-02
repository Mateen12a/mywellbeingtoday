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

export default router;
