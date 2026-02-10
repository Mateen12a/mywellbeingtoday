import PushSubscription from '../models/PushSubscription.js';
import { AppError } from '../middlewares/errorHandler.js';

export const subscribe = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw new AppError('Invalid subscription data', 400, 'INVALID_SUBSCRIPTION');
    }

    const existing = await PushSubscription.findOne({ endpoint });
    if (existing) {
      existing.userId = req.user._id;
      existing.keys = keys;
      existing.userAgent = req.headers['user-agent'] || '';
      await existing.save();
    } else {
      await PushSubscription.create({
        userId: req.user._id,
        endpoint,
        keys,
        userAgent: req.headers['user-agent'] || ''
      });
    }

    res.json({
      success: true,
      message: 'Push subscription saved'
    });
  } catch (error) {
    next(error);
  }
};

export const unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      throw new AppError('Endpoint required', 400, 'MISSING_ENDPOINT');
    }

    await PushSubscription.deleteOne({ userId: req.user._id, endpoint });

    res.json({
      success: true,
      message: 'Push subscription removed'
    });
  } catch (error) {
    next(error);
  }
};

export const getVapidPublicKey = async (req, res) => {
  res.json({
    success: true,
    data: { publicKey: process.env.VAPID_PUBLIC_KEY || null }
  });
};

export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const count = await PushSubscription.countDocuments({ userId: req.user._id });
    res.json({
      success: true,
      data: { subscribed: count > 0, count }
    });
  } catch (error) {
    next(error);
  }
};
