import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import User from '../models/User.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@mywellbeingtoday.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('[PUSH] Web push configured with VAPID keys');
} else {
  console.log('[PUSH] VAPID keys not configured - push notifications disabled');
}

export async function sendPushNotification(userId, { title, body, icon = '/icon-192.png', badge = '/icon-192.png', url = '/', tag = '' }) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log('[PUSH] Push notification skipped (VAPID keys not configured):', { userId: userId.toString(), title });
    return;
  }

  try {
    const subscriptions = await PushSubscription.find({ userId });
    
    if (subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon,
      badge,
      url,
      tag,
      timestamp: Date.now()
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }
            },
            payload
          );
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await PushSubscription.deleteOne({ _id: sub._id });
            console.log('[PUSH] Removed expired subscription for user:', userId.toString());
          } else {
            console.error('[PUSH] Error sending to subscription:', error.message);
          }
        }
      })
    );

    return results;
  } catch (error) {
    console.error('[PUSH] Error sending push notification:', error.message);
  }
}

export async function sendPushToUser(userId, notificationType, data = {}) {
  try {
    const user = await User.findById(userId).select('settings').lean();
    if (user?.settings?.notifications?.push === false) {
      return;
    }
  } catch (err) {
    // Continue with push if user preference check fails
  }

  const notifications = {
    login: {
      title: 'New Login',
      body: `Welcome back! You logged in successfully.`,
      url: '/dashboard'
    },
    register: {
      title: 'Welcome to mywellbeingtoday!',
      body: 'Your account is set up. Start tracking your wellbeing today.',
      url: '/dashboard'
    },
    mood_logged: {
      title: 'Mood Tracked',
      body: `Your mood has been recorded. Keep it up!`,
      url: '/history'
    },
    activity_logged: {
      title: 'Activity Logged',
      body: `Your activity "${data.title || ''}" has been recorded.`,
      url: '/history'
    },
    appointment_booked: {
      title: 'Appointment Booked',
      body: `Your appointment with ${data.providerName || 'your provider'} has been booked.`,
      url: '/appointments'
    },
    appointment_cancelled: {
      title: 'Appointment Cancelled',
      body: `Your appointment with ${data.providerName || 'your provider'} has been cancelled.`,
      url: '/appointments'
    },
    emergency: {
      title: 'Emergency Services',
      body: 'Emergency services information accessed.',
      url: '/directory?tab=emergency'
    },
    provider_verified: {
      title: 'Profile Verified',
      body: 'Your provider profile has been verified!',
      url: '/provider-dashboard'
    }
  };

  const notif = notifications[notificationType];
  if (notif) {
    return sendPushNotification(userId, { ...notif, tag: notificationType });
  }
}

export default { sendPushNotification, sendPushToUser };
