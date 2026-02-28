import { Router } from 'express';
import { Subscription } from '../models/index.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

const PRICING = {
  free: {
    price: 0,
    interval: null,
    displayPrice: 'Free',
    name: 'Free Trial',
    trialDays: 7
  },
  starter: {
    price: 5,
    interval: 'month',
    displayPrice: '$5/mo',
    name: 'Starter'
  },
  pro: {
    price: 12,
    interval: 'month',
    displayPrice: '$12/mo',
    name: 'Pro'
  },
  premium: {
    price: 20,
    interval: 'month',
    displayPrice: '$20/mo',
    name: 'Premium'
  },
  team: {
    price: null,
    interval: null,
    displayPrice: 'On request',
    name: 'Team / Enterprise'
  },
  franchise: {
    price: null,
    interval: null,
    displayPrice: 'On request',
    name: 'Franchise'
  }
};

export const PLAN_LIMITS = {
  free: {
    activityLogs: 2,
    moodLogs: 2,
    reportDownloads: 1,
    directoryAccess: 2,
    aiInteractions: 2
  },
  starter: {
    activityLogs: 10,
    moodLogs: 10,
    reportDownloads: 3,
    directoryAccess: 10,
    aiInteractions: 10
  },
  pro: {
    activityLogs: -1,
    moodLogs: -1,
    reportDownloads: -1,
    directoryAccess: -1,
    aiInteractions: -1
  },
  premium: {
    activityLogs: -1,
    moodLogs: -1,
    reportDownloads: -1,
    directoryAccess: -1,
    aiInteractions: -1
  },
  team: {
    activityLogs: -1,
    moodLogs: -1,
    reportDownloads: -1,
    directoryAccess: -1,
    aiInteractions: -1
  },
  franchise: {
    activityLogs: -1,
    moodLogs: -1,
    reportDownloads: -1,
    directoryAccess: -1,
    aiInteractions: -1
  }
};

const isStripeConfigured = () => {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
};

async function checkAndResetUsage(subscription) {
  if (subscription.shouldResetUsage()) {
    subscription.resetUsage();
    await subscription.save();
  }
  return subscription;
}

export async function checkUsageLimit(userId, feature) {
  let subscription = await Subscription.findOne({ userId });
  if (!subscription) {
    subscription = await Subscription.create({
      userId,
      plan: 'free',
      status: 'active'
    });
  }

  await checkAndResetUsage(subscription);

  const plan = subscription.plan;
  const limits = PLAN_LIMITS[plan];
  if (!limits) return { allowed: false, reason: 'Invalid plan' };

  const limit = limits[feature];
  if (limit === undefined) return { allowed: true };
  if (limit === -1) return { allowed: true };

  const currentUsage = subscription.usage?.[feature] || 0;
  if (currentUsage >= limit) {
    return {
      allowed: false,
      reason: `You have reached your ${plan} plan limit of ${limit} ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()} this month. Please upgrade your plan.`,
      currentUsage,
      limit
    };
  }

  return { allowed: true, currentUsage, limit };
}

export async function incrementUsage(userId, feature) {
  let subscription = await Subscription.findOne({ userId });
  if (!subscription) {
    subscription = await Subscription.create({
      userId,
      plan: 'free',
      status: 'active'
    });
  }

  await checkAndResetUsage(subscription);

  if (subscription.usage && feature in subscription.usage) {
    subscription.usage[feature] = (subscription.usage[feature] || 0) + 1;
    subscription.markModified('usage');
    await subscription.save();
  }
  return subscription;
}

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

    await checkAndResetUsage(subscription);

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
        planLimits: PLAN_LIMITS,
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

router.get('/usage', authenticate, async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ userId: req.userId });

    if (!subscription) {
      subscription = await Subscription.create({
        userId: req.userId,
        plan: 'free',
        status: 'active'
      });
    }

    await checkAndResetUsage(subscription);

    const plan = subscription.plan;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    res.json({
      success: true,
      data: {
        plan,
        usage: subscription.usage,
        limits,
        usagePeriodStart: subscription.usagePeriodStart
      }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage stats'
    });
  }
});

router.post('/check-usage', authenticate, async (req, res) => {
  try {
    const { feature } = req.body;
    if (!feature) {
      return res.status(400).json({ success: false, message: 'Feature is required' });
    }

    const result = await checkUsageLimit(req.userId, feature);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Check usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check usage'
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
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    if (subscription) {
      subscription.status = 'trial';
      subscription.trialEndsAt = trialEndsAt;
      subscription.resetUsage();
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
      message: 'Your 7-day free trial has started!',
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

    if (!plan || !['starter', 'pro', 'premium', 'team', 'franchise'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Choose starter, pro, premium, team, or franchise.'
      });
    }

    if (['team', 'franchise'].includes(plan)) {
      return res.json({
        success: false,
        message: 'Please contact us for Team and Franchise plans.',
        code: 'CONTACT_REQUIRED'
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

    try {
      const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
      const appUrl = process.env.APP_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000');

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `MyWellbeingToday ${PRICING[plan].name} Plan`,
              description: `${PRICING[plan].name} subscription plan`
            },
            unit_amount: Math.round(PRICING[plan].price * 100),
            recurring: { interval: 'month' }
          },
          quantity: 1
        }],
        success_url: `${appUrl}/subscription?success=true&plan=${plan}`,
        cancel_url: `${appUrl}/subscription?cancelled=true`,
        metadata: {
          userId: req.userId.toString(),
          plan
        }
      });

      return res.json({
        success: true,
        data: {
          checkoutUrl: session.url,
          sessionId: session.id
        }
      });
    } catch (stripeError) {
      console.error('Stripe checkout error:', stripeError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create checkout session. Please try again.',
        code: 'STRIPE_ERROR'
      });
    }
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade subscription'
    });
  }
});

router.post('/webhook', async (req, res) => {
  if (!isStripeConfigured()) {
    return res.status(400).json({ success: false, message: 'Stripe not configured' });
  }

  try {
    const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    let event;

    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      const rawBody = req.rawBody || req.body;
      event = stripe.webhooks.constructEvent(
        Buffer.isBuffer(rawBody) ? rawBody : JSON.stringify(rawBody),
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = req.body;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, plan } = session.metadata;
        if (userId && plan) {
          let subscription = await Subscription.findOne({ userId });
          if (!subscription) {
            subscription = await Subscription.create({ userId, plan, status: 'active' });
          } else {
            subscription.plan = plan;
            subscription.status = 'active';
            subscription.stripeSubscriptionId = session.subscription;
            subscription.stripeCustomerId = session.customer;
            subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            subscription.resetUsage();
            await subscription.save();
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const subscription = await Subscription.findOne({ stripeSubscriptionId: sub.id });
        if (subscription) {
          subscription.status = 'cancelled';
          subscription.cancelledAt = new Date();
          subscription.plan = 'free';
          await subscription.save();
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscription = await Subscription.findOne({ stripeCustomerId: invoice.customer });
        if (subscription) {
          subscription.status = 'expired';
          subscription.plan = 'free';
          await subscription.save();
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ success: false, message: 'Webhook error' });
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
      planLimits: PLAN_LIMITS,
      trialDays: 7,
      stripeConfigured: isStripeConfigured()
    }
  });
});

export default router;
