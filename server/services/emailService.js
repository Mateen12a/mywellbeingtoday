import { Resend } from 'resend';
import path from 'path';
import fs from 'fs';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const SENDER_EMAIL = `mywellbeingtoday <${process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev'}>`;

const LOGO_CID = 'logo@mywellbeingtoday';
let LOGO_BUFFER = null;
try {
  const logoPath = path.resolve('client/public/logo5.png');
  if (fs.existsSync(logoPath)) {
    LOGO_BUFFER = fs.readFileSync(logoPath);
  }
} catch (e) {
  console.log('[EMAIL SERVICE] Could not load logo file:', e.message);
}

function getLogoAttachments() {
  if (!LOGO_BUFFER) return [];
  return [{
    filename: 'logo.png',
    content: LOGO_BUFFER,
    content_id: LOGO_CID,
  }];
}

const COLORS = {
  primary: '#97b5cb',
  secondary: '#adccdb',
  text: '#1F2937',
  lightText: '#6B7280',
  lightBg: '#F3F4F6',
  border: '#E5E7EB',
  white: '#FFFFFF'
};

const FONT_STACK = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

const LOGO_IMG_SRC = `cid:${LOGO_CID}`;

const createEmailHeader = () => `
<!--[if mso]>
<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:140px;">
  <v:fill type="gradient" color="${COLORS.primary}" color2="${COLORS.secondary}" angle="135" />
  <v:textbox inset="0,0,0,0" style="mso-fit-shape-to-text:false;">
    <center>
<![endif]-->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr>
    <td align="center" style="padding:28px 30px 24px 30px; background-color:${COLORS.primary};">
      <!--[if !mso]><!-->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td align="center" style="background:linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%); padding:0;">
      <!--<![endif]-->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              <tr>
                <td align="center" style="padding-bottom:12px;">
                  <img src="${LOGO_IMG_SRC}" alt="mywellbeingtoday" width="50" height="50" style="display:block; width:50px; height:50px; border-radius:25px; border:0;" />
                </td>
              </tr>
              <tr>
                <td align="center" style="font-family:${FONT_STACK}; font-size:28px; font-weight:700; color:${COLORS.white}; letter-spacing:-0.5px; line-height:1.2;">
                  mywellbeingtoday
                </td>
              </tr>
              <tr>
                <td align="center" style="font-family:${FONT_STACK}; font-size:13px; color:rgba(255,255,255,0.9); padding-top:6px; line-height:1.4;">
                  Your personal wellbeing companion
                </td>
              </tr>
            </table>
      <!--[if !mso]><!-->
          </td>
        </tr>
      </table>
      <!--<![endif]-->
    </td>
  </tr>
</table>
<!--[if mso]>
    </center>
  </v:textbox>
</v:rect>
<![endif]-->
`;

const createEmailFooter = () => `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr>
    <td style="padding:0 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="border-top:2px solid ${COLORS.border}; font-size:0; line-height:0;" height="1">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:24px 30px 28px 30px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td align="center" style="font-family:${FONT_STACK}; font-size:13px; color:${COLORS.lightText}; line-height:1.6;">
            &copy; 2026 mywellbeingtoday. All rights reserved.
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family:${FONT_STACK}; font-size:13px; color:${COLORS.lightText}; line-height:1.6; padding-top:4px;">
            Taking care of your wellbeing, one day at a time.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

const createCTAButton = (url, text) => `
<table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse; margin:30px auto;">
  <tr>
    <td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" strokecolor="${COLORS.primary}" fillcolor="${COLORS.primary}">
        <w:anchorlock/>
        <center style="color:${COLORS.white};font-family:${FONT_STACK};font-size:16px;font-weight:600;">${text}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${url}" style="display:inline-block; background-color:${COLORS.primary}; color:${COLORS.white}; text-decoration:none; padding:14px 36px; font-family:${FONT_STACK}; font-weight:600; font-size:16px; line-height:1.2; border-radius:8px; mso-hide:all;">
        ${text}
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>
`;

const createOTPDigitBoxes = (otpCode) => {
  const digits = otpCode.toString().split('');
  const cells = [];
  digits.forEach((d, i) => {
    if (i > 0) {
      cells.push(`<td style="width:8px; font-size:0;" width="8">&nbsp;</td>`);
    }
    cells.push(`
      <!--[if mso]>
      <td width="48" height="56" align="center" valign="middle" style="width:48px; height:56px; border:2px solid ${COLORS.primary}; background-color:${COLORS.lightBg}; font-family:${FONT_STACK}; font-size:28px; font-weight:700; color:${COLORS.text};">
        ${d}
      </td>
      <![endif]-->
      <!--[if !mso]><!-->
      <td width="48" height="56" align="center" valign="middle" style="width:48px; height:56px; border:2px solid ${COLORS.primary}; border-radius:8px; background-color:${COLORS.lightBg}; font-family:${FONT_STACK}; font-size:28px; font-weight:700; color:${COLORS.text};">
        ${d}
      </td>
      <!--<![endif]-->
    `);
  });
  return cells.join('');
};

const createEmailWrapper = (content) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>mywellbeingtoday</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse:collapse;}
    td {font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;}
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:${COLORS.lightBg}; font-family:${FONT_STACK}; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <!--[if mso]>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.lightBg};">
    <tr>
      <td align="center" style="padding:20px 0;">
  <![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; background-color:${COLORS.lightBg};">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;">
          <tr>
            <td style="background-color:${COLORS.white};">
        <![endif]-->
        <!--[if !mso]><!-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; max-width:600px; margin:0 auto; background-color:${COLORS.white}; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td>
        <!--<![endif]-->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                ${content}
              </table>
        <!--[if mso]>
            </td>
          </tr>
        </table>
        <![endif]-->
        <!--[if !mso]><!-->
            </td>
          </tr>
        </table>
        <!--<![endif]-->
      </td>
    </tr>
  </table>
  <!--[if mso]>
      </td>
    </tr>
  </table>
  <![endif]-->
</body>
</html>`;

const createOTPEmailTemplate = (userName, otpCode) => {
  const digitBoxes = createOTPDigitBoxes(otpCode);
  const content = `
    <tr>
      <td>
        ${createEmailHeader()}
      </td>
    </tr>
    <tr>
      <td style="padding:36px 30px 40px 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:20px; font-weight:700; color:${COLORS.text}; line-height:1.4; padding-bottom:16px;">
              Verify Your Email
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; padding-bottom:20px;">
              Hello ${userName},
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; padding-bottom:24px;">
              Your verification code is:
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;">
                <tr>
                  ${digitBoxes}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-family:${FONT_STACK}; font-size:14px; color:${COLORS.lightText}; line-height:1.6; padding-bottom:20px;">
              This code expires in <strong>10 minutes</strong>.
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:14px; color:${COLORS.lightText}; line-height:1.6;">
              <strong>Security Note:</strong> If you didn't request this, ignore this email. We'll never ask for your password via email.
            </td>
          </tr>
        </table>
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

const createVerificationEmailTemplate = (userName, verificationLink) => {
  const content = `
    <tr>
      <td>
        ${createEmailHeader()}
      </td>
    </tr>
    <tr>
      <td style="padding:36px 30px 40px 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:20px; font-weight:700; color:${COLORS.text}; line-height:1.4; padding-bottom:16px;">
              Verify Your Email
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; padding-bottom:20px;">
              Hello ${userName},
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; padding-bottom:24px;">
              Welcome to <strong>mywellbeingtoday</strong>! We're excited to have you on board. To complete your registration and start your wellbeing journey, please verify your email address by clicking the button below.
            </td>
          </tr>
          <tr>
            <td>
              ${createCTAButton(verificationLink, 'Verify Email Address')}
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:14px; color:${COLORS.lightText}; line-height:1.6; padding-top:8px;">
              <strong>Security Note:</strong> This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email. We'll never ask for your password via email.
            </td>
          </tr>
        </table>
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

const createPasswordResetEmailTemplate = (userName, otpCode) => {
  const digitBoxes = createOTPDigitBoxes(otpCode);
  const content = `
    <tr>
      <td>
        ${createEmailHeader()}
      </td>
    </tr>
    <tr>
      <td style="padding:36px 30px 40px 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:20px; font-weight:700; color:${COLORS.text}; line-height:1.4; padding-bottom:16px;">
              Reset Your Password
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; padding-bottom:20px;">
              Hello ${userName},
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; padding-bottom:24px;">
              We received a request to reset your password. Use the code below to proceed with your password reset:
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;">
                <tr>
                  ${digitBoxes}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-family:${FONT_STACK}; font-size:14px; color:${COLORS.lightText}; line-height:1.6; padding-bottom:20px;">
              This code expires in <strong>1 hour</strong>.
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:14px; color:${COLORS.lightText}; line-height:1.6;">
              If you didn't request a password reset, please ignore this email or contact our support team immediately. Your account remains secure.
            </td>
          </tr>
        </table>
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
      <td style="padding:36px 30px 40px 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:20px; font-weight:700; color:${COLORS.text}; line-height:1.4; padding-bottom:16px;">
              Welcome, ${userName}!
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; padding-bottom:24px;">
              Your account is now active and ready to use. We're thrilled to have you as part of the <strong>mywellbeingtoday</strong> community.
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; font-weight:600; padding-bottom:12px;">
              Here's what you can do:
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0 8px 0; font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6;">
                    &#8226;&nbsp;&nbsp;Track your mood and daily activities
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0 8px 0; font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6;">
                    &#8226;&nbsp;&nbsp;Get personalized wellbeing insights
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0 8px 0; font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6;">
                    &#8226;&nbsp;&nbsp;Connect with healthcare providers
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0 8px 0; font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6;">
                    &#8226;&nbsp;&nbsp;Build and maintain healthy habits
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0 0 0; font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6;">
                    &#8226;&nbsp;&nbsp;Access your personal health records
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              ${createCTAButton('https://mywellbeingtoday.com/dashboard', 'Go to Dashboard')}
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:14px; color:${COLORS.lightText}; line-height:1.6; padding-top:8px;">
              Have questions? Our support team is here to help. We're committed to supporting you on your wellbeing journey every step of the way.
            </td>
          </tr>
        </table>
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
  const locationRow = appointmentLocation ? `
    <tr>
      <td style="padding:14px 20px; font-family:${FONT_STACK};">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:12px; font-weight:600; color:${COLORS.lightText}; text-transform:uppercase; letter-spacing:0.5px; line-height:1.4; padding-bottom:4px;">
              Location
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; font-weight:600; color:${COLORS.text}; line-height:1.4;">
              ${appointmentLocation}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  const content = `
    <tr>
      <td>
        ${createEmailHeader()}
      </td>
    </tr>
    <tr>
      <td style="padding:36px 30px 40px 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:20px; font-weight:700; color:${COLORS.text}; line-height:1.4; padding-bottom:16px;">
              Appointment Confirmed
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; padding-bottom:20px;">
              Hello ${patientName},
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; padding-bottom:24px;">
              Your appointment with <strong>${providerName}</strong> has been confirmed. Here are the details:
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <!--[if mso]>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.lightBg};">
              <![endif]-->
              <!--[if !mso]><!-->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; background-color:${COLORS.lightBg}; border-radius:8px; overflow:hidden;">
              <!--<![endif]-->
                <tr>
                  <td style="padding:14px 20px; border-bottom:1px solid ${COLORS.border};">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="font-family:${FONT_STACK}; font-size:12px; font-weight:600; color:${COLORS.lightText}; text-transform:uppercase; letter-spacing:0.5px; line-height:1.4; padding-bottom:4px;">
                          Provider
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family:${FONT_STACK}; font-size:16px; font-weight:600; color:${COLORS.text}; line-height:1.4;">
                          ${providerName}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px; border-bottom:1px solid ${COLORS.border};">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="font-family:${FONT_STACK}; font-size:12px; font-weight:600; color:${COLORS.lightText}; text-transform:uppercase; letter-spacing:0.5px; line-height:1.4; padding-bottom:4px;">
                          Appointment Type
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family:${FONT_STACK}; font-size:16px; font-weight:600; color:${COLORS.text}; line-height:1.4;">
                          ${appointmentType}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px; border-bottom:1px solid ${COLORS.border};">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="font-family:${FONT_STACK}; font-size:12px; font-weight:600; color:${COLORS.lightText}; text-transform:uppercase; letter-spacing:0.5px; line-height:1.4; padding-bottom:4px;">
                          Date
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family:${FONT_STACK}; font-size:16px; font-weight:600; color:${COLORS.text}; line-height:1.4;">
                          ${appointmentDate}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;${appointmentLocation ? ' border-bottom:1px solid ' + COLORS.border + ';' : ''}">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="font-family:${FONT_STACK}; font-size:12px; font-weight:600; color:${COLORS.lightText}; text-transform:uppercase; letter-spacing:0.5px; line-height:1.4; padding-bottom:4px;">
                          Time
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family:${FONT_STACK}; font-size:16px; font-weight:600; color:${COLORS.text}; line-height:1.4;">
                          ${appointmentTime}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${locationRow}
              </table>
            </td>
          </tr>
          <tr>
            <td>
              ${createCTAButton('https://mywellbeingtoday.com/appointments', 'View Appointment Details')}
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:14px; color:${COLORS.lightText}; line-height:1.6; padding-top:8px;">
              <strong>Please remember:</strong> Please plan to arrive 5-10 minutes early. If you need to reschedule or cancel, please log in to your account to manage your appointments. We respect your time and ask for at least 24 hours notice for cancellations.
            </td>
          </tr>
        </table>
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
      <td style="padding:36px 30px 40px 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:20px; font-weight:700; color:${COLORS.text}; line-height:1.4; padding-bottom:16px;">
              ${subject}
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; padding-bottom:20px;">
              Hello ${userName},
            </td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK}; font-size:16px; color:${COLORS.text}; line-height:1.6; padding-bottom:24px;">
              ${content}
            </td>
          </tr>
          ${actionUrl ? `<tr><td>${createCTAButton(actionUrl, actionText)}</td></tr>` : ''}
        </table>
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
      html,
      attachments: getLogoAttachments()
    });

    console.log('[EMAIL SERVICE] Verification email sent to:', email);
    return response;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending verification email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email, userName, otpCode) {
  try {
    if (!resend) {
      console.log('[EMAIL SERVICE] RESEND_API_KEY not configured. Password reset email would be sent to:', {
        to: email,
        userName,
        otpCode,
        timestamp: new Date().toISOString()
      });
      return { success: true, fallback: true, message: 'Email logged (API key not configured)' };
    }

    const html = createPasswordResetEmailTemplate(userName, otpCode);
    const response = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Reset Your Password - mywellbeingtoday',
      html,
      attachments: getLogoAttachments()
    });

    console.log('[EMAIL SERVICE] Password reset email sent to:', email);
    return response;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending password reset email:', error);
    throw error;
  }
}

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
      html,
      attachments: getLogoAttachments()
    });

    console.log('[EMAIL SERVICE] Welcome email sent to:', email);
    return response;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending welcome email:', error);
    throw error;
  }
}

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
      html,
      attachments: getLogoAttachments()
    });

    console.log('[EMAIL SERVICE] Appointment confirmation email sent to:', email);
    return response;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending appointment confirmation email:', error);
    throw error;
  }
}

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
      html,
      attachments: getLogoAttachments()
    });

    console.log('[EMAIL SERVICE] Notification email sent to:', email, 'Subject:', subject);
    return response;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending notification email:', error);
    throw error;
  }
}

export async function sendOTPEmail(email, userName, otpCode) {
  try {
    if (!resend) {
      console.log('[EMAIL SERVICE] RESEND_API_KEY not configured. OTP email would be sent to:', {
        to: email,
        userName,
        otpCode,
        timestamp: new Date().toISOString()
      });
      return { success: true, fallback: true, message: 'Email logged (API key not configured)' };
    }

    const html = createOTPEmailTemplate(userName, otpCode);
    const response = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Your Verification Code - mywellbeingtoday',
      html,
      attachments: getLogoAttachments()
    });

    console.log('[EMAIL SERVICE] OTP email sent to:', email);
    return response;
  } catch (error) {
    console.error('[EMAIL SERVICE] Error sending OTP email:', error);
    throw error;
  }
}

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAppointmentConfirmation,
  sendNotification,
  sendOTPEmail
};
