// utils/createNotification.js
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendMail, Templates } = require("./mailer");

async function createNotification(userId, type, message, link = null, options = {}) {
  try {
    const { title, sendEmail = true, emailTemplate, emailData } = options;
    
    const user = await User.findById(userId).select("email firstName lastName notificationPreferences");
    if (!user) {
      console.error("User not found for notification:", userId);
      return null;
    }
    
    const prefs = user.notificationPreferences || {};
    
    const typePreferenceMap = {
      'application': 'proposalUpdates',
      'proposal': 'proposalUpdates',
      'message': 'messageNotifications',
      'task': 'taskUpdates',
      'system': 'systemUpdates',
      'admin': 'systemUpdates',
    };
    
    const prefKey = typePreferenceMap[type] || 'systemUpdates';
    const shouldNotify = prefs.inAppNotifications !== false && prefs[prefKey] !== false;
    
    let notif = null;
    
    if (shouldNotify) {
      notif = new Notification({
        user: userId,
        type,
        message,
        title: title || null,
        link,
        emailSent: false,
      });
      await notif.save();
    }
    
    const shouldEmail = sendEmail && prefs.emailNotifications !== false && prefs[prefKey] !== false;
    
    if (shouldEmail && user.email) {
      try {
        let html;
        if (emailTemplate && Templates[emailTemplate]) {
          html = Templates[emailTemplate](...(emailData || []));
        } else {
          html = Templates.genericNotification ? Templates.genericNotification(user, message, link) : null;
        }
        
        if (html) {
          const result = await sendMail(user.email, title || `Notification: ${type}`, html);
          if (notif && result.success) {
            notif.emailSent = true;
            await notif.save();
          }
        }
      } catch (emailErr) {
        console.warn("Email notification failed:", emailErr.message);
      }
    }
    
    return notif;
  } catch (err) {
    console.error("Notification creation error:", err);
    return null;
  }
}

async function createBulkNotifications(userIds, type, message, link = null, options = {}) {
  const results = await Promise.allSettled(
    userIds.map(userId => createNotification(userId, type, message, link, options))
  );
  return results.filter(r => r.status === 'fulfilled').map(r => r.value);
}

module.exports = createNotification;
module.exports.createBulkNotifications = createBulkNotifications;
