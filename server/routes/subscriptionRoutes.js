import { Router } from 'express';
import { Subscription } from '../models/index.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

const PRICING = {
  free: {
    price: 0,
    interval: null,
    displayPrice: 'Free',
    name: 'Free'
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
    directoryAccess: 2,
    aiInteractions: 2
  },
  starter: {
    activityLogs: 10,
    moodLogs: 10,
    directoryAccess: 10,
    aiInteractions: 10
  },
  pro: {
    activityLogs: -1,
    moodLogs: -1,
    directoryAccess: -1,
    aiInteractions: -1
  },
  premium: {
    activityLogs: -1,
    moodLogs: -1,
    directoryAccess: -1,
    aiInteractions: -1
  },
  team: {
    activityLogs: -1,
    moodLogs: -1,
    directoryAccess: -1,
    aiInteractions: -1
  },
  franchise: {
    activityLogs: -1,
    moodLogs: -1,
    directoryAccess: -1,
    aiInteractions: -1
  }
};

const isStripeConfigured = () => {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
};

async function getStripe() {
  const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

async function getOrCreateStripeCustomer(userId) {
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  let subscription = await Subscription.findOne({ userId });
  const stripe = await getStripe();

  if (subscription?.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(subscription.stripeCustomerId);
      if (!existing.deleted) {
        return { customerId: subscription.stripeCustomerId, user, subscription };
      }
    } catch (err) {
      if (err?.code === 'resource_missing' || err?.raw?.code === 'resource_missing') {
        console.warn('[Stripe] Stored customer ID not found in current Stripe account, creating new customer:', subscription.stripeCustomerId);
        subscription.stripeCustomerId = null;
        subscription.stripeSubscriptionId = null;
        await subscription.save();
      } else {
        throw err;
      }
    }
  }

  const existingCustomers = await stripe.customers.list({
    email: user.email,
    limit: 1,
  });

  let customerId;
  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.profile?.displayName || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || undefined,
      metadata: { userId: userId.toString() },
    });
    customerId = customer.id;
  }

  if (!subscription) {
    subscription = await Subscription.create({
      userId,
      plan: 'free',
      status: 'active',
      stripeCustomerId: customerId,
    });
  } else {
    subscription.stripeCustomerId = customerId;
    await subscription.save();
  }

  return { customerId, user, subscription };
}

function getAppUrl() {
  return process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000');
}

async function checkAndResetUsage(subscription) {
  let changed = false;
  if (subscription.shouldResetUsage()) {
    subscription.resetUsage();
    changed = true;
  }
  if (subscription.shouldResetMonthlyUsage()) {
    subscription.resetMonthlyUsage();
    changed = true;
  }
  if (changed) {
    await subscription.save();
  }
  return subscription;
}

const MONTHLY_FEATURES = ['directoryAccess'];

const MONTHLY_PLAN_LIMITS = {
  free: { directoryAccess: 10 },
  starter: { directoryAccess: 50 },
  pro: { directoryAccess: -1 },
  premium: { directoryAccess: -1 },
  team: { directoryAccess: -1 },
  franchise: { directoryAccess: -1 }
};

export async function checkMonthlyUsageLimit(userId, feature) {
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
  const limits = MONTHLY_PLAN_LIMITS[plan];
  if (!limits) return { allowed: false, reason: 'Invalid plan' };

  const limit = limits[feature];
  if (limit === undefined) return { allowed: true };
  if (limit === -1) return { allowed: true };

  const currentUsage = subscription.monthlyUsage?.[feature] || 0;
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
      reason: `You have reached your ${plan} plan limit of ${limit} ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()} today. Please upgrade your plan.`,
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

    if (!subscription.monthlyUsage) {
      subscription.monthlyUsage = { activityLogs: 0, moodLogs: 0, reportDownloads: 0, directoryAccess: 0, aiInteractions: 0 };
    }
    subscription.monthlyUsage[feature] = (subscription.monthlyUsage[feature] || 0) + 1;
    subscription.markModified('monthlyUsage');

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
      subscription.previousPlan = subscription.plan !== 'free' ? subscription.plan : subscription.previousPlan;
      subscription.status = 'expired';
      subscription.plan = 'free';
      await subscription.save();
    }

    if (subscription.currentPeriodEnd && new Date() > subscription.currentPeriodEnd && subscription.status === 'active' && subscription.plan !== 'free') {
      subscription.previousPlan = subscription.plan;
      subscription.status = 'expired';
      subscription.plan = 'free';
      await subscription.save();
    }

    if (subscription.status === 'cancelled' && !subscription.previousPlan && subscription.plan !== 'free') {
      subscription.previousPlan = subscription.plan;
      subscription.plan = 'free';
      await subscription.save();

      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(subscription.userId, {
        'subscription.plan': 'free',
      });
    }

    let hasPaymentMethod = false;
    if (isStripeConfigured() && subscription.stripeCustomerId) {
      try {
        const stripe = await getStripe();
        const methods = await stripe.paymentMethods.list({
          customer: subscription.stripeCustomerId,
          type: 'card',
          limit: 1,
        });
        hasPaymentMethod = methods.data.length > 0;
      } catch {}
    }

    const subJson = subscription.toJSON();

    if (subscription.currentPeriodEnd) {
      const periodEnd = new Date(subscription.currentPeriodEnd);
      const periodStart = subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart) : (() => {
        const fallback = new Date(periodEnd);
        fallback.setMonth(fallback.getMonth() - 1);
        return fallback;
      })();
      const now = new Date();
      const daysLeft = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      subJson.billingPeriod = {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        daysRemaining: daysLeft,
      };
    }

    res.json({
      success: true,
      data: {
        subscription: subJson,
        pricing: PRICING,
        planLimits: PLAN_LIMITS,
        monthlyPlanLimits: MONTHLY_PLAN_LIMITS,
        monthlyFeatures: MONTHLY_FEATURES,
        stripeConfigured: isStripeConfigured(),
        hasPaymentMethod,
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

    const monthlyUsage = subscription.monthlyUsage || {
      activityLogs: 0, moodLogs: 0, reportDownloads: 0, directoryAccess: 0, aiInteractions: 0
    };

    res.json({
      success: true,
      data: {
        plan,
        usage: subscription.usage,
        monthlyUsage,
        limits,
        usagePeriodStart: subscription.usagePeriodStart,
        monthlyUsagePeriodStart: subscription.monthlyUsagePeriodStart
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

router.get('/payment-methods', authenticate, async (req, res) => {
  try {
    if (!isStripeConfigured()) {
      return res.json({ success: true, data: { paymentMethods: [], defaultPaymentMethodId: null } });
    }

    const { customerId } = await getOrCreateStripeCustomer(req.userId);
    const stripe = await getStripe();

    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    const customer = await stripe.customers.retrieve(customerId);
    const defaultPmId = customer.invoice_settings?.default_payment_method || null;

    const paymentMethods = methods.data.map(pm => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      isDefault: pm.id === defaultPmId,
    }));

    res.json({
      success: true,
      data: { paymentMethods, defaultPaymentMethodId: defaultPmId }
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payment methods' });
  }
});

router.post('/payment-methods/add', authenticate, async (req, res) => {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({ success: false, message: 'Payment processing not configured' });
    }

    const { customerId } = await getOrCreateStripeCustomer(req.userId);
    const stripe = await getStripe();
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      payment_method_types: ['card'],
      success_url: `${appUrl}/subscription?card_added=true`,
      cancel_url: `${appUrl}/subscription?card_cancelled=true`,
      metadata: { userId: req.userId.toString(), purpose: 'add_card' },
    });

    res.json({
      success: true,
      data: { checkoutUrl: session.url }
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ success: false, message: 'Failed to set up card addition' });
  }
});

router.post('/payment-methods/default', authenticate, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: 'Payment method ID required' });
    }

    if (!isStripeConfigured()) {
      return res.status(503).json({ success: false, message: 'Payment processing not configured' });
    }

    const { customerId } = await getOrCreateStripeCustomer(req.userId);
    const stripe = await getStripe();

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer !== customerId) {
      return res.status(403).json({ success: false, message: 'Payment method does not belong to this account' });
    }

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    const subscription = await Subscription.findOne({ userId: req.userId });
    if (subscription?.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        default_payment_method: paymentMethodId,
      });
    }

    res.json({ success: true, message: 'Default payment method updated' });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ success: false, message: 'Failed to set default payment method' });
  }
});

router.delete('/payment-methods/:id', authenticate, async (req, res) => {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({ success: false, message: 'Payment processing not configured' });
    }

    const { customerId } = await getOrCreateStripeCustomer(req.userId);
    const stripe = await getStripe();
    const pmId = req.params.id;

    const pm = await stripe.paymentMethods.retrieve(pmId);
    if (pm.customer !== customerId) {
      return res.status(403).json({ success: false, message: 'Payment method does not belong to this account' });
    }

    await stripe.paymentMethods.detach(pmId);

    res.json({ success: true, message: 'Payment method removed' });
  } catch (error) {
    console.error('Remove payment method error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove payment method' });
  }
});

router.post('/billing-portal', authenticate, async (req, res) => {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({ success: false, message: 'Payment processing not configured' });
    }

    const { customerId } = await getOrCreateStripeCustomer(req.userId);
    const stripe = await getStripe();
    const appUrl = getAppUrl();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/dashboard`,
    });

    res.json({ success: true, data: { portalUrl: portalSession.url } });
  } catch (error) {
    console.error('Billing portal error:', error);
    res.status(500).json({ success: false, message: 'Failed to create billing portal session' });
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

    const { customerId, subscription } = await getOrCreateStripeCustomer(req.userId);
    const stripe = await getStripe();
    const appUrl = getAppUrl();

    const PLAN_RANK = { free: 0, starter: 1, pro: 2, premium: 3, team: 4, franchise: 5 };
    const currentRank = PLAN_RANK[subscription.plan] || 0;
    const targetRank = PLAN_RANK[plan] || 0;

    if (subscription.status === 'cancelled' && subscription.previousPlan === plan && subscription.currentPeriodEnd) {
      const now = new Date();
      const periodEnd = new Date(subscription.currentPeriodEnd);
      if (now < periodEnd) {
        let stripeReactivated = false;
        if (isStripeConfigured() && subscription.stripeSubscriptionId) {
          try {
            const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
            if (stripeSub.status === 'active' && stripeSub.cancel_at_period_end) {
              const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                cancel_at_period_end: false,
              });
              if (updated.current_period_end) {
                subscription.currentPeriodEnd = new Date(updated.current_period_end * 1000);
              }
              if (updated.current_period_start) {
                subscription.currentPeriodStart = new Date(updated.current_period_start * 1000);
              }
              stripeReactivated = true;
            }
          } catch (err) {
            console.log('Stripe sub not resumable, will create new:', err.message);
          }
        }

        if (stripeReactivated || !isStripeConfigured()) {
          subscription.plan = plan;
          subscription.status = 'active';
          subscription.cancelledAt = null;
          subscription.previousPlan = null;
          await subscription.save();

          const User = (await import('../models/User.js')).default;
          await User.findByIdAndUpdate(req.userId, {
            'subscription.plan': plan,
            'subscription.status': 'active',
            'subscription.expiresAt': subscription.currentPeriodEnd,
          });

          return res.json({
            success: true,
            data: { subscription: subscription.toJSON(), reactivated: true },
            message: `Your ${PRICING[plan].name} plan has been reactivated`,
          });
        }
      }
    }

    if (targetRank < currentRank && subscription.status === 'active' && subscription.currentPeriodEnd) {
      const now = new Date();
      const periodEnd = new Date(subscription.currentPeriodEnd);
      if (now < periodEnd) {
        const daysLeft = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return res.status(400).json({
          success: false,
          message: `You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining on your ${PRICING[subscription.plan].name} plan (expires ${periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}). You can switch to a lower plan once your current billing period ends.`,
          code: 'DOWNGRADE_NOT_ALLOWED',
          data: {
            currentPeriodEnd: periodEnd.toISOString(),
            daysRemaining: daysLeft,
          }
        });
      }
    }

    if (subscription.stripeSubscriptionId && subscription.status === 'active') {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

        if (stripeSub.status === 'active' || stripeSub.status === 'trialing') {
          const newPrice = Math.round(PRICING[plan].price * 100);

          const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            items: [{
              id: stripeSub.items.data[0].id,
              price_data: {
                currency: 'usd',
                product: stripeSub.items.data[0].price.product,
                unit_amount: newPrice,
                recurring: { interval: 'month' },
              },
            }],
            proration_behavior: 'create_prorations',
            metadata: { userId: req.userId.toString(), plan },
          });

          subscription.plan = plan;
          subscription.status = 'active';
          subscription.currentPeriodStart = new Date(updated.current_period_start * 1000);
          subscription.currentPeriodEnd = new Date(updated.current_period_end * 1000);
          await subscription.save();

          const User = (await import('../models/User.js')).default;
          await User.findByIdAndUpdate(req.userId, {
            'subscription.plan': plan,
            'subscription.status': 'active',
            'subscription.expiresAt': subscription.currentPeriodEnd,
          });

          return res.json({
            success: true,
            data: { subscription: subscription.toJSON(), upgraded: true },
            message: `Plan changed to ${PRICING[plan].name}`,
          });
        }
      } catch (stripeSubErr) {
        console.log('Existing subscription invalid, creating new checkout:', stripeSubErr.message);
      }
    }

    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 1,
    });

    if (methods.data.length > 0) {
      const customer = await stripe.customers.retrieve(customerId);
      const defaultPm = customer.invoice_settings?.default_payment_method || methods.data[0].id;

      const productName = `MyWellbeingToday ${PRICING[plan].name} Plan`;
      const existingProducts = await stripe.products.list({ limit: 100, active: true });
      let product = existingProducts.data.find(p => p.name === productName);
      if (!product) {
        product = await stripe.products.create({
          name: productName,
          description: `${PRICING[plan].name} subscription plan`,
        });
      }

      const unitAmount = Math.round(PRICING[plan].price * 100);
      const existingPrices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
      let price = existingPrices.data.find(p =>
        p.unit_amount === unitAmount &&
        p.currency === 'usd' &&
        p.recurring?.interval === 'month'
      );
      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: unitAmount,
          currency: 'usd',
          recurring: { interval: 'month' },
        });
      }

      let newSub;
      try {
        newSub = await stripe.subscriptions.create({
          customer: customerId,
          default_payment_method: defaultPm,
          items: [{ price: price.id }],
          metadata: { userId: req.userId.toString(), plan },
          expand: ['latest_invoice.payment_intent'],
        });
      } catch (subCreateErr) {
        console.error('Subscription create error:', subCreateErr.message);
        if (subCreateErr.type === 'StripeCardError') {
          return res.status(402).json({
            success: false,
            message: subCreateErr.message || 'Your card was declined. Please update your payment method.',
            code: 'PAYMENT_FAILED',
          });
        }
        throw subCreateErr;
      }

      const invoice = newSub.latest_invoice;
      const paymentIntent = invoice?.payment_intent;

      if (paymentIntent?.status === 'requires_action') {
        return res.json({
          success: true,
          data: {
            requiresAction: true,
            clientSecret: paymentIntent.client_secret,
            subscriptionId: newSub.id,
          },
        });
      }

      if (paymentIntent?.status === 'requires_payment_method') {
        return res.status(402).json({
          success: false,
          message: 'Payment failed. Please update your card and try again.',
          code: 'PAYMENT_FAILED',
        });
      }

      if (newSub.status === 'incomplete' && paymentIntent) {
        try {
          const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id);
          if (confirmed.status === 'requires_action') {
            return res.json({
              success: true,
              data: {
                requiresAction: true,
                clientSecret: confirmed.client_secret,
                subscriptionId: newSub.id,
              },
            });
          }
          if (confirmed.status === 'succeeded') {
            newSub = await stripe.subscriptions.retrieve(newSub.id);
          } else {
            return res.status(402).json({
              success: false,
              message: 'Payment could not be completed. Please try again.',
              code: 'PAYMENT_FAILED',
            });
          }
        } catch (confirmErr) {
          console.error('Payment confirm error:', confirmErr.message);
          return res.status(402).json({
            success: false,
            message: 'Payment failed. Please update your card and try again.',
            code: 'PAYMENT_FAILED',
          });
        }
      }

      if (newSub.status !== 'active' && newSub.status !== 'trialing') {
        return res.status(402).json({
          success: false,
          message: 'Subscription could not be activated. Please try again.',
          code: 'SUBSCRIPTION_INACTIVE',
        });
      }

      subscription.plan = plan;
      subscription.status = 'active';
      subscription.stripeSubscriptionId = newSub.id;
      subscription.stripeCustomerId = customerId;
      subscription.currentPeriodStart = new Date(newSub.current_period_start * 1000);
      subscription.currentPeriodEnd = new Date(newSub.current_period_end * 1000);
      subscription.previousPlan = null;
      subscription.cancelledAt = null;
      await subscription.save();

      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(req.userId, {
        'subscription.plan': plan,
        'subscription.status': 'active',
        'subscription.expiresAt': subscription.currentPeriodEnd,
      });

      return res.json({
        success: true,
        data: { subscription: subscription.toJSON(), upgraded: true },
        message: `Plan upgraded to ${PRICING[plan].name} using saved card`,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      payment_method_collection: 'always',
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
      success_url: `${appUrl}/subscription?success=true&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
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
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade subscription'
    });
  }
});

router.post('/confirm-upgrade', authenticate, async (req, res) => {
  try {
    const { plan, sessionId } = req.body;

    if (!plan || !['starter', 'pro', 'premium'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan'
      });
    }

    if (!isStripeConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Payment processing not configured'
      });
    }

    const stripe = await getStripe();
    let validSession = null;

    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (
          session.metadata?.userId === req.userId.toString() &&
          session.metadata?.plan === plan &&
          session.payment_status === 'paid' &&
          session.status === 'complete'
        ) {
          validSession = session;
        }
      } catch (e) {
        console.error('Failed to retrieve session by ID:', e.message);
      }
    }

    if (!validSession) {
      const sessions = await stripe.checkout.sessions.list({ limit: 10 });
      validSession = sessions.data.find(s =>
        s.metadata?.userId === req.userId.toString() &&
        s.metadata?.plan === plan &&
        s.payment_status === 'paid' &&
        s.status === 'complete'
      );
    }

    if (!validSession) {
      return res.status(403).json({
        success: false,
        message: 'No valid completed payment found for this plan upgrade'
      });
    }

    let subscription = await Subscription.findOne({ userId: req.userId });

    if (!subscription) {
      subscription = await Subscription.create({
        userId: req.userId,
        plan,
        status: 'active',
        stripeSubscriptionId: validSession.subscription,
        stripeCustomerId: validSession.customer,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    } else {
      subscription.plan = plan;
      subscription.status = 'active';
      subscription.stripeSubscriptionId = validSession.subscription || subscription.stripeSubscriptionId;
      subscription.stripeCustomerId = validSession.customer || subscription.stripeCustomerId;
      subscription.currentPeriodStart = subscription.currentPeriodStart || new Date();
      subscription.currentPeriodEnd = subscription.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await subscription.save();
    }

    const User = (await import('../models/User.js')).default;
    await User.findByIdAndUpdate(req.userId, {
      'subscription.plan': plan,
      'subscription.status': 'active',
      'subscription.expiresAt': subscription.currentPeriodEnd
    });

    res.json({
      success: true,
      message: `Plan upgraded to ${plan}`,
      data: { subscription: subscription.toJSON() }
    });
  } catch (error) {
    console.error('Confirm upgrade error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm upgrade'
    });
  }
});

router.post('/webhook', async (req, res) => {
  if (!isStripeConfigured()) {
    return res.status(400).json({ success: false, message: 'Stripe not configured' });
  }

  try {
    const stripe = await getStripe();
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
        const { userId, plan } = session.metadata || {};

        if (session.mode === 'setup') {
          if (session.setup_intent && session.customer) {
            try {
              const stripe = await getStripe();
              const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent);
              if (setupIntent.payment_method) {
                await stripe.customers.update(session.customer, {
                  invoice_settings: { default_payment_method: setupIntent.payment_method }
                });
              }
            } catch (e) {
              console.error('Auto-set default payment method error:', e.message);
            }
          }
          break;
        }

        if (userId && plan) {
          const User = (await import('../models/User.js')).default;

          let periodStart = new Date();
          let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          if (isStripeConfigured() && session.subscription) {
            try {
              const stripe = await getStripe();
              const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
              if (stripeSub.current_period_start) periodStart = new Date(stripeSub.current_period_start * 1000);
              if (stripeSub.current_period_end) periodEnd = new Date(stripeSub.current_period_end * 1000);
            } catch (e) {
              console.error('Failed to fetch Stripe sub dates:', e.message);
            }
          }

          let subscription = await Subscription.findOne({ userId });
          if (!subscription) {
            subscription = await Subscription.create({
              userId,
              plan,
              status: 'active',
              stripeSubscriptionId: session.subscription,
              stripeCustomerId: session.customer,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
            });
          } else {
            subscription.plan = plan;
            subscription.status = 'active';
            subscription.stripeSubscriptionId = session.subscription;
            subscription.stripeCustomerId = session.customer;
            subscription.currentPeriodStart = periodStart;
            subscription.currentPeriodEnd = periodEnd;
            subscription.previousPlan = null;
            subscription.cancelledAt = null;
            await subscription.save();
          }

          await User.findByIdAndUpdate(userId, {
            'subscription.plan': plan,
            'subscription.status': 'active',
            'subscription.expiresAt': subscription.currentPeriodEnd
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const subscription = await Subscription.findOne({ stripeSubscriptionId: sub.id });
        if (subscription) {
          subscription.currentPeriodStart = new Date(sub.current_period_start * 1000);
          subscription.currentPeriodEnd = new Date(sub.current_period_end * 1000);
          if (sub.status === 'active') {
            subscription.status = 'active';
          }
          await subscription.save();
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const subscription = await Subscription.findOne({ stripeSubscriptionId: sub.id });
        if (subscription) {
          const User = (await import('../models/User.js')).default;
          subscription.previousPlan = subscription.plan !== 'free' ? subscription.plan : subscription.previousPlan;
          subscription.status = 'cancelled';
          subscription.cancelledAt = new Date();
          subscription.plan = 'free';
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
            'subscription.plan': 'free',
            'subscription.status': 'cancelled'
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscription = await Subscription.findOne({ stripeCustomerId: invoice.customer });
        if (subscription) {
          const User = (await import('../models/User.js')).default;
          subscription.previousPlan = subscription.plan !== 'free' ? subscription.plan : subscription.previousPlan;
          subscription.status = 'expired';
          subscription.plan = 'free';
          await subscription.save();

          await User.findByIdAndUpdate(subscription.userId, {
            'subscription.plan': 'free',
            'subscription.status': 'expired'
          });
        }
        break;
      }
      case 'payment_method.attached': {
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

    if (isStripeConfigured() && subscription.stripeSubscriptionId) {
      try {
        const stripe = await getStripe();
        const stripeSub = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        if (stripeSub.current_period_end) {
          subscription.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
        }
        if (stripeSub.current_period_start) {
          subscription.currentPeriodStart = new Date(stripeSub.current_period_start * 1000);
        }
      } catch (err) {
        console.error('Stripe cancel error:', err.message);
      }
    }

    subscription.previousPlan = subscription.plan;
    subscription.plan = 'free';
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    const User = (await import('../models/User.js')).default;
    await User.findByIdAndUpdate(req.userId, {
      'subscription.plan': 'free',
      'subscription.status': 'cancelled'
    });

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
      stripeConfigured: isStripeConfigured(),
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    }
  });
});

router.get('/stripe-key', (req, res) => {
  res.json({
    success: true,
    data: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    }
  });
});

export default router;
