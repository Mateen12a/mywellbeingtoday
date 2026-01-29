import { Router } from 'express';
import { Subscription } from '../models/index.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

const PRICING = {
  monthly: {
    price: 19.99,
    interval: 'month',
    displayPrice: '$19.99/mo'
  },
  yearly: {
    price: 191.88,
    interval: 'year',
    monthlyEquivalent: 15.99,
    displayPrice: '$191.88/yr ($15.99/mo)'
  }
};

const isStripeConfigured = () => {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
};

router.get('/', authenticate, async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ userId: req.userId });
    
    if (!subscription) {
      subscription = await Subscription.create({
        userId: req.userId,
        plan: 'free',
        status: 'active'
      });
    }

    if (subscription.status === 'trial' && subscription.trialEndsAt && new Date() > subscription.trialEndsAt) {
      subscription.status = 'expired';
      subscription.plan = 'free';
      await subscription.save();
    }

    if (subscription.currentPeriodEnd && new Date() > subscription.currentPeriodEnd && subscription.status === 'active' && subscription.plan !== 'free') {
      subscription.status = 'expired';
      subscription.plan = 'free';
      await subscription.save();
    }

    res.json({
      success: true,
      data: {
        subscription: subscription.toJSON(),
        pricing: PRICING,
        stripeConfigured: isStripeConfigured()
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status'
    });
  }
});

router.post('/start-trial', authenticate, async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ userId: req.userId });
    
    if (subscription) {
      if (subscription.status === 'trial' || subscription.plan !== 'free') {
        return res.status(400).json({
          success: false,
          message: 'You have already used your free trial or have an active subscription'
        });
      }
      
      if (subscription.trialEndsAt) {
        return res.status(400).json({
          success: false,
          message: 'You have already used your free trial'
        });
      }
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 15);

    if (subscription) {
      subscription.status = 'trial';
      subscription.trialEndsAt = trialEndsAt;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        userId: req.userId,
        plan: 'free',
        status: 'trial',
        trialEndsAt
      });
    }

    res.json({
      success: true,
      message: 'Your 15-day free trial has started!',
      data: {
        subscription: subscription.toJSON()
      }
    });
  } catch (error) {
    console.error('Start trial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start trial'
    });
  }
});

router.post('/upgrade', authenticate, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Choose monthly or yearly.'
      });
    }

    if (!isStripeConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Payment processing is coming soon. Please check back later.',
        code: 'STRIPE_NOT_CONFIGURED'
      });
    }

    let subscription = await Subscription.findOne({ userId: req.userId });
    
    if (!subscription) {
      subscription = await Subscription.create({
        userId: req.userId,
        plan: 'free',
        status: 'active'
      });
    }

    res.json({
      success: false,
      message: 'Stripe integration pending. Contact support for manual upgrade.',
      code: 'STRIPE_INTEGRATION_PENDING',
      data: {
        subscription: subscription.toJSON(),
        pricing: PRICING[plan]
      }
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade subscription'
    });
  }
});

router.post('/cancel', authenticate, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.userId });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    if (subscription.plan === 'free' && subscription.status !== 'trial') {
      return res.status(400).json({
        success: false,
        message: 'You are on the free plan'
      });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    res.json({
      success: true,
      message: 'Your subscription has been cancelled',
      data: {
        subscription: subscription.toJSON()
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

router.get('/pricing', async (req, res) => {
  res.json({
    success: true,
    data: {
      pricing: PRICING,
      trialDays: 15,
      stripeConfigured: isStripeConfigured()
    }
  });
});

export default router;
