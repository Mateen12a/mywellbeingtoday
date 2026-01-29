import { Resend } from 'resend';

// Initialize Resend client
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// Sender email configuration - use environment variable or fallback to Resend test email
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';

// Color scheme for professional, calm emails
const COLORS = {
  primary: '#10B981',      // Calm green
  secondary: '#06B6D4',    // Calm cyan
  accent: '#3B82F6',       // Professional blue
  text: '#1F2937',         // Dark gray
  lightText: '#6B7280',    // Light gray text
  lightBg: '#F3F4F6',      // Light gray background
  border: '#E5E7EB',       // Border color
  white: '#FFFFFF'         // White
};

// ============ EMAIL TEMPLATE COMPONENTS ============

const createEmailHeader = () => `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%);">
        <h1 style="margin: 0; color: ${COLORS.white}; font-size: 32px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 700; letter-spacing: -0.5px;">
          mywellbeingtoday
        </h1>
        <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 14px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 400;">
          Your personal wellbeing companion
        </p>
      </td>
    </tr>
  </table>
`;

const createEmailFooter = () => `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 40px; border-top: 2px solid ${COLORS.border};">
    <tr>
      <td style="padding: 30px; text-align: center;">
        <p style="margin: 0 0 10px 0; color: ${COLORS.lightText}; font-size: 13px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;">
          © 2026 mywellbeingtoday. All rights reserved.
        </p>
        <p style="margin: 0; color: ${COLORS.lightText}; font-size: 13px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;">
          Taking care of your wellbeing, one day at a time.
        </p>
      </td>
    </tr>
  </table>
`;

const createCTAButton = (url, text) => `
  <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 30px auto; border-radius: 8px;">
    <tr>
      <td style="background-color: ${COLORS.accent}; border-radius: 8px; text-align: center; padding: 0;">
        <a href="${url}" style="color: ${COLORS.white}; text-decoration: none; display: block; padding: 16px 40px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 600; font-size: 16px; line-height: 1.2;">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

const createEmailWrapper = (content) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      table {
        border-collapse: collapse;
      }
      a {
        color: inherit;
      }
      img {
        border: none;
        max-width: 100%;
        display: block;
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${COLORS.lightBg}; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; margin: 0 auto;">
            <tr>
              <td style="background-color: ${COLORS.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                ${content}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

// ============ EMAIL TEMPLATES ============

const createVerificationEmailTemplate = (userName, verificationLink) => {
  const content = `
    <tr>
      <td>
        ${createEmailHeader()}
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 18px; color: ${COLORS.text}; line-height: 1.6; font-weight: 600;">
          Verify Your Email
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
          Hello ${userName},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
          Welcome to <strong>mywellbeingtoday</strong>! We're excited to have you on board. To complete your registration and start your wellbeing journey, please verify your email address by clicking the button below.
        </p>
        ${createCTAButton(verificationLink, 'Verify Email Address')}
        <p style="margin: 24px 0 0 0; font-size: 14px; color: ${COLORS.lightText}; line-height: 1.6;">
          <strong>Security Note:</strong> This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email. We'll never ask for your password via email.
        </p>
      </td>
    </tr>
    <tr>
      <td>
        ${createEmailFooter()}
      </td>
    </tr>
  `;
  return createEmailWrapper(content);
};

const createPasswordResetEmailTemplate = (userName, resetLink) => {
  const content = `
    <tr>
      <td>
        ${createEmailHeader()}
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 18px; color: ${COLORS.text}; line-height: 1.6; font-weight: 600;">
          Reset Your Password
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
          Hello ${userName},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour for your security.
        </p>
        ${createCTAButton(resetLink, 'Reset Password')}
        <p style="margin: 24px 0 0 0; font-size: 14px; color: ${COLORS.lightText}; line-height: 1.6;">
          If you didn't request a password reset, please ignore this email or contact our support team immediately. Your account remains secure.
        </p>
      </td>
    </tr>
    <tr>
      <td>
        ${createEmailFooter()}
      </td>
    </tr>
  `;
  return createEmailWrapper(content);
};

const createWelcomeEmailTemplate = (userName) => {
  const content = `
    <tr>
      <td>
        ${createEmailHeader()}
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 12px 0; font-size: 18px; color: ${COLORS.text}; line-height: 1.6; font-weight: 600;">
          Welcome, ${userName}! 🎉
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
          Your account is now active and ready to use. We're thrilled to have you as part of the <strong>mywellbeingtoday</strong> community.
        </p>
        
        <p style="margin: 24px 0 16px 0; font-size: 16px; color: ${COLORS.text}; line-height: 1.6; font-weight: 600;">
          Here's what you can do:
        </p>
        <ul style="margin: 0 0 24px 0; padding-left: 24px; color: ${COLORS.text}; font-size: 16px; line-height: 1.8;">
          <li style="margin-bottom: 12px;">Track your mood and daily activities</li>
          <li style="margin-bottom: 12px;">Get personalized wellbeing insights</li>
          <li style="margin-bottom: 12px;">Connect with healthcare providers</li>
          <li style="margin-bottom: 12px;">Build and maintain healthy habits</li>
          <li>Access your personal health records</li>
        </ul>
        
        ${createCTAButton('https://mywellbeingtoday.com/dashboard', 'Go to Dashboard')}
        
        <p style="margin: 24px 0 0 0; font-size: 14px; color: ${COLORS.lightText}; line-height: 1.6;">
          Have questions? Our support team is here to help. We're committed to supporting you on your wellbeing journey every step of the way.
        </p>
      </td>
    </tr>
    <tr>
      <td>
        ${createEmailFooter()}
      </td>
    </tr>
  `;
  return createEmailWrapper(content);
};

const createAppointmentConfirmationEmailTemplate = (patientName, providerName, appointmentDate, appointmentTime, appointmentType, appointmentLocation = null) => {
  const content = `
    <tr>
      <td>
        ${createEmailHeader()}
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 18px; color: ${COLORS.text}; line-height: 1.6; font-weight: 600;">
          Appointment Confirmed ✓
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
          Hello ${patientName},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
          Your appointment with <strong>${providerName}</strong> has been confirmed. Here are the details:
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 24px 0; background-color: ${COLORS.lightBg}; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid ${COLORS.border};">
              <p style="margin: 0 0 6px 0; color: ${COLORS.lightText}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Provider
              </p>
              <p style="margin: 0; color: ${COLORS.text}; font-size: 16px; font-weight: 600;">
                ${providerName}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid ${COLORS.border};">
              <p style="margin: 0 0 6px 0; color: ${COLORS.lightText}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Appointment Type
              </p>
              <p style="margin: 0; color: ${COLORS.text}; font-size: 16px; font-weight: 600;">
                ${appointmentType}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid ${COLORS.border};">
              <p style="margin: 0 0 6px 0; color: ${COLORS.lightText}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Date
              </p>
              <p style="margin: 0; color: ${COLORS.text}; font-size: 16px; font-weight: 600;">
                ${appointmentDate}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px; ${appointmentLocation ? 'border-bottom: 1px solid ' + COLORS.border + ';' : ''}">
              <p style="margin: 0 0 6px 0; color: ${COLORS.lightText}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Time
              </p>
              <p style="margin: 0; color: ${COLORS.text}; font-size: 16px; font-weight: 600;">
                ${appointmentTime}
              </p>
            </td>
          </tr>
          ${appointmentLocation ? `
            <tr>
              <td style="padding: 16px 20px;">
                <p style="margin: 0 0 6px 0; color: ${COLORS.lightText}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Location
                </p>
                <p style="margin: 0; color: ${COLORS.text}; font-size: 16px; font-weight: 600;">
                  ${appointmentLocation}
                </p>
              </td>
            </tr>
          ` : ''}
        </table>
        
        ${createCTAButton('https://mywellbeingtoday.com/appointments', 'View Appointment Details')}
        
        <p style="margin: 24px 0 0 0; font-size: 14px; color: ${COLORS.lightText}; line-height: 1.6;">
          <strong>Please remember:</strong> Please plan to arrive 5-10 minutes early. If you need to reschedule or cancel, please log in to your account to manage your appointments. We respect your time and ask for at least 24 hours notice for cancellations.
        </p>
      </td>
    </tr>
    <tr>
      <td>
        ${createEmailFooter()}
      </td>
    </tr>
  `;
  return createEmailWrapper(content);
};

const createNotificationEmailTemplate = (userName, subject, content, actionUrl = null, actionText = 'Learn More') => {
  const htmlContent = `
    <tr>
      <td>
        ${createEmailHeader()}
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 18px; color: ${COLORS.text}; line-height: 1.6; font-weight: 600;">
          ${subject}
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
          Hello ${userName},
        </p>
        <div style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
          ${content}
        </div>
        ${actionUrl ? createCTAButton(actionUrl, actionText) : ''}
      </td>
    </tr>
    <tr>
      <td>
        ${createEmailFooter()}
      </td>
    </tr>
  `;
  return createEmailWrapper(htmlContent);
};

// ============ EXPORT FUNCTIONS ============

/**
 * Send verification email to confirm email address
 * @param {string} email - Recipient email address
 * @param {string} userName - User's name
 * @param {string} verificationLink - Link to verify email
 * @returns {Promise} - Resend response or fallback success
 */
export async function sendVerificationEmail(email, userName, verificationLink) {
  try {
    if (!resend) {
      console.log('[EMAIL SERVICE] RESEND_API_KEY not configured. Verification email would be sent to:', {
        to: email,
        userName,
        verificationLink,
        timestamp: new Date().toISOString()
      });
      return { success: true, fallback: true, message: 'Email logged (API key not configured)' };
    }

    const html = createVerificationEmailTemplate(userName, verificationLink);
    const response = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Verify Your Email - mywellbeingtoday',
      html
    });

    console.log('[EMAIL SERVICE] Verification email sent to:', email);
    return response;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending verification email:', error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} userName - User's name
 * @param {string} resetLink - Link to reset password
 * @returns {Promise} - Resend response or fallback success
 */
export async function sendPasswordResetEmail(email, userName, resetLink) {
  try {
    if (!resend) {
      console.log('[EMAIL SERVICE] RESEND_API_KEY not configured. Password reset email would be sent to:', {
        to: email,
        userName,
        resetLink,
        timestamp: new Date().toISOString()
      });
      return { success: true, fallback: true, message: 'Email logged (API key not configured)' };
    }

    const html = createPasswordResetEmailTemplate(userName, resetLink);
    const response = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Reset Your Password - mywellbeingtoday',
      html
    });

    console.log('[EMAIL SERVICE] Password reset email sent to:', email);
    return response;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending password reset email:', error);
    throw error;
  }
}

/**
 * Send welcome email after successful registration
 * @param {string} email - Recipient email address
 * @param {string} userName - User's name
 * @returns {Promise} - Resend response or fallback success
 */
export async function sendWelcomeEmail(email, userName) {
  try {
    if (!resend) {
      console.log('[EMAIL SERVICE] RESEND_API_KEY not configured. Welcome email would be sent to:', {
        to: email,
        userName,
        timestamp: new Date().toISOString()
      });
      return { success: true, fallback: true, message: 'Email logged (API key not configured)' };
    }

    const html = createWelcomeEmailTemplate(userName);
    const response = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Welcome to mywellbeingtoday',
      html
    });

    console.log('[EMAIL SERVICE] Welcome email sent to:', email);
    return response;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending welcome email:', error);
    throw error;
  }
}

/**
 * Send appointment confirmation email
 * @param {string} email - Recipient email address
 * @param {string} patientName - Patient's name
 * @param {string} providerName - Provider's name
 * @param {string} appointmentDate - Appointment date
 * @param {string} appointmentTime - Appointment time
 * @param {string} appointmentType - Type of appointment
 * @param {string} appointmentLocation - Location of appointment (optional)
 * @returns {Promise} - Resend response or fallback success
 */
export async function sendAppointmentConfirmation(
  email,
  patientName,
  providerName,
  appointmentDate,
  appointmentTime,
  appointmentType,
  appointmentLocation = null
) {
  try {
    if (!resend) {
      console.log('[EMAIL SERVICE] RESEND_API_KEY not configured. Appointment confirmation email would be sent to:', {
        to: email,
        patientName,
        providerName,
        appointmentDate,
        appointmentTime,
        appointmentType,
        appointmentLocation,
        timestamp: new Date().toISOString()
      });
      return { success: true, fallback: true, message: 'Email logged (API key not configured)' };
    }

    const html = createAppointmentConfirmationEmailTemplate(
      patientName,
      providerName,
      appointmentDate,
      appointmentTime,
      appointmentType,
      appointmentLocation
    );

    const response = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Appointment Confirmed - mywellbeingtoday',
      html
    });

    console.log('[EMAIL SERVICE] Appointment confirmation email sent to:', email);
    return response;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending appointment confirmation email:', error);
    throw error;
  }
}

/**
 * Send generic notification email
 * @param {string} email - Recipient email address
 * @param {string} userName - User's name
 * @param {string} subject - Email subject
 * @param {string} content - Email content (HTML)
 * @param {string} actionUrl - Optional URL for CTA button
 * @param {string} actionText - Text for CTA button
 * @returns {Promise} - Resend response or fallback success
 */
export async function sendNotification(
  email,
  userName,
  subject,
  content,
  actionUrl = null,
  actionText = 'Learn More'
) {
  try {
    if (!resend) {
      console.log('[EMAIL SERVICE] RESEND_API_KEY not configured. Notification email would be sent to:', {
        to: email,
        userName,
        subject,
        content,
        actionUrl,
        actionText,
        timestamp: new Date().toISOString()
      });
      return { success: true, fallback: true, message: 'Email logged (API key not configured)' };
    }

    const html = createNotificationEmailTemplate(userName, subject, content, actionUrl, actionText);
    const response = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject,
      html
    });

    console.log('[EMAIL SERVICE] Notification email sent to:', email, 'Subject:', subject);
    return response;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending notification email:', error);
    throw error;
  }
}

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAppointmentConfirmation,
  sendNotification
};
