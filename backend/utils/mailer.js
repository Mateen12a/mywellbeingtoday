// utils/mailer.js
const { Resend } = require("resend");

// Initialize Resend only if API key is available
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("Resend initialized with API Key (masked):", process.env.RESEND_API_KEY.substring(0, 5) + "...");
} else {
  console.warn("Warning: RESEND_API_KEY not configured. Email functionality is disabled.");
}

// Brand colors
const COLORS = {
  primary: '#1E376E',
  primaryLight: '#2B4A8C',
  accent: '#E96435',
  accentLight: '#F07B4F',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  textDark: '#1F2937',
  textLight: '#6B7280',
  bgLight: '#F9FAFB',
  bgWhite: '#FFFFFF',
  border: '#E5E7EB',
};

// Modern email layout with enhanced styling (Outlook/Apple Mail compatible)
function emailLayout({ title, preheader = '', content, footerText = '' }) {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body, table, td, p, a, li {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      mso-line-height-rule: exactly;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: ${COLORS.textDark};
      background-color: ${COLORS.bgLight};
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    
    .btn {
      display: inline-block;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
    }
    
    .btn-primary {
      background-color: ${COLORS.primary};
      color: #ffffff !important;
    }
    
    .btn-accent {
      background-color: ${COLORS.accent};
      color: #ffffff !important;
    }
    
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px 20px !important; }
      .btn { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0 !important;padding:0 !important;background-color:${COLORS.bgLight};width:100% !important;">
  ${preheader ? `<div style="display:none;font-size:1px;color:${COLORS.bgLight};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}
  
  <!--[if mso]>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bgLight};">
  <tr><td align="center" style="padding:40px 20px;">
  <![endif]-->
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${COLORS.bgLight};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bgWhite};">
        <![endif]-->
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:${COLORS.bgWhite};border-radius:16px;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${COLORS.primary};padding:32px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#ffffff;border-radius:12px;padding:12px 20px;">
                          <img src="https://globalhealth.works/new-logo.png" alt="GlobalHealth.Works" width="auto" height="60" style="height:60px;width:auto;display:block;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;padding:0;line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${title}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding:32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${COLORS.textDark};">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:${COLORS.bgLight};padding:24px 40px;border-top:1px solid ${COLORS.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${footerText ? `
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p style="color:${COLORS.textLight};font-size:13px;margin:0;padding:0;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${footerText}</p>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td align="center">
                    <p style="color:${COLORS.textLight};font-size:12px;margin:0;padding:0;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      &copy; ${new Date().getFullYear()} GlobalHealth.Works &middot; Where Global Health Problems Meet Global Health Solutions
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;">
                    <a href="https://globalhealth.works" style="color:${COLORS.primary};text-decoration:none;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Website</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        <!--[if mso]>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
  
  <!--[if mso]>
  </td></tr></table>
  <![endif]-->
</body>
</html>
  `;
}

// Helper function for Outlook-compatible spacing (uses table row instead of margin)
function spacer(height = 20) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="height:${height}px;line-height:${height}px;font-size:1px;">&nbsp;</td></tr></table>`;
}

// Helper for paragraph with Outlook-compatible spacing
function p(text, options = {}) {
  const { size = 16, color = COLORS.textDark, spacingAfter = 20 } = options;
  return `<p style="font-size:${size}px;color:${color};margin:0;padding:0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${text}</p>${spacingAfter > 0 ? spacer(spacingAfter) : ''}`;
}

// Send email using Resend
async function sendMail(to, subject, htmlContent) {
  // If Resend is not configured, return success (emails are skipped)
  if (!resend) {
    console.log(`[Email Skipped] To: ${to}, Subject: ${subject} (RESEND_API_KEY not configured)`);
    return { success: true, skipped: true };
  }
  
  try {
    console.log(`[Email Attempt] Sending email to ${to} with subject "${subject}"`);
    const { data, error } = await resend.emails.send({
      from: "GlobalHealth.Works <admin@globalhealth.works>",
      to,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("[Email Error] Resend reported failure:", error);
      return { error };
    } else {
      console.log("[Email Success] Email sent successfully. ID:", data.id);
      return { data };
    }
  } catch (err) {
    console.error("[Email Exception] Unexpected error in sendMail:", err);
    return { error: err.message };
  }
}

// Email Templates
const Templates = {
  newUserAdminAlert: (user) =>
    emailLayout({
      title: "New User Registration",
      preheader: `New ${user.role} registration requires your review`,
      content: `
        ${p('Hello Admin,')}
        ${p(`A new <strong style="color:${COLORS.textDark};">${user.role}</strong> has registered and requires your approval.`, { spacingAfter: 24 })}
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};color:${COLORS.textLight};width:140px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><strong>Name</strong></td>
            <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${user.firstName} ${user.lastName}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};color:${COLORS.textLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><strong>Email</strong></td>
            <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${user.email}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};color:${COLORS.textLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><strong>Organisation</strong></td>
            <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${user.organisationName || "Not specified"}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};color:${COLORS.textLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><strong>Country</strong></td>
            <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${user.country || "Not specified"}</td>
          </tr>
        </table>
        
        ${spacer(32)}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://globalhealth.works/admin/users/${user._id}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="17%" strokecolor="${COLORS.primary}" fillcolor="${COLORS.primary}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Review User</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="https://globalhealth.works/admin/users/${user._id}" style="display:inline-block;padding:14px 28px;background-color:${COLORS.primary};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Review User</a>
              <!--<![endif]-->
            </td>
          </tr>
        </table>
      `,
    }),

  userApprovalNotice: (user) =>
    emailLayout({
      title: "Welcome to GlobalHealth.Works!",
      preheader: "Your account has been approved - you can now log in",
      content: `
        ${p(`Dear ${user.firstName},`)}
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background-color:#D1FAE5;border-left:4px solid ${COLORS.success};padding:16px 20px;border-radius:0 8px 8px 0;">
              <strong style="color:#065F46;">Great news!</strong> <span style="color:#065F46;">Your account has been approved by our admin team.</span>
            </td>
          </tr>
        </table>
        
        ${spacer(20)}
        ${p('You now have full access to GlobalHealth.Works. Log in to start connecting with global health professionals, browse opportunities, and make an impact.', { spacingAfter: 32 })}
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://globalhealth.works/login" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" strokecolor="${COLORS.accent}" fillcolor="${COLORS.accent}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Log In to Your Account</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="https://globalhealth.works/login" style="display:inline-block;padding:14px 28px;background-color:${COLORS.accent};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Log In to Your Account</a>
              <!--<![endif]-->
            </td>
          </tr>
        </table>
        
        ${spacer(24)}
        ${p(`Best regards,<br><strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>`, { size: 14, spacingAfter: 0 })}
      `,
    }),

  approvalConfirmedAdminNotice: (admin, user) =>
    emailLayout({
      title: "User Approved",
      preheader: `You approved ${user.firstName} ${user.lastName}'s account`,
      content: `
        ${p(`Hello ${admin.firstName},`)}
        ${p('You have successfully approved the following user:', { spacingAfter: 24 })}
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background-color:#F0F9FF;border-left:4px solid ${COLORS.primary};padding:16px 20px;border-radius:0 8px 8px 0;">
              <p style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><strong>${user.firstName} ${user.lastName}</strong></p>
              ${spacer(4)}
              <p style="margin:0;padding:0;color:${COLORS.textLight};font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${user.email} &middot; ${user.role}</p>
            </td>
          </tr>
        </table>
        
        ${spacer(20)}
        ${p('Thank you for helping maintain our community standards.', { size: 14, color: COLORS.textLight, spacingAfter: 0 })}
      `,
    }),

  welcomePending: (user) => {
    const isSolutionProvider = user.role === "solutionProvider";
    const roleTitle = isSolutionProvider ? "Solution Provider" : "Task Owner";
    
    const solutionProviderContent = `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${user.firstName},</p>
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:24px;">Thank you for applying to join <strong style="color:${COLORS.textDark};">GlobalHealth.Works</strong> as a Solution Provider.</p>
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:24px;">To maintain the integrity of our network and ensure the security of all members, our team manually reviews every new account. Your application is currently in the queue and will be finalized shortly. We appreciate your patience in helping us keep Global Health Works a trusted space.</p>
        
        <div class="info-box">
          <strong>What happens next?</strong>
          <p style="margin:8px 0 0;font-size:14px;">To ensure the quality of our marketplace, our team verifies the credentials of every provider. This process typically takes 24-48 hours.</p>
        </div>
        
        <p style="color:${COLORS.textDark};font-weight:600;margin:24px 0 12px;">Once verified, you will unlock access to:</p>
        <ul style="color:${COLORS.textDark};margin:0 0 24px;padding-left:20px;">
          <li style="margin-bottom:8px;"><strong style="color:${COLORS.textDark};">High-Impact Tasks:</strong> Browse and apply for challenges posted by Task Owners.</li>
          <li style="margin-bottom:8px;"><strong style="color:${COLORS.textDark};">Global Health Collaboration:</strong> Partner with other experts to deliver solutions.</li>
        </ul>
        
        <div class="warning-box">
          <strong>While you wait:</strong>
          <p style="margin:8px 0 0;font-size:14px;">We recommend preparing your portfolio or CV so you are ready to apply for tasks the moment your account is live.</p>
        </div>
        
        <p style="color:${COLORS.textDark};margin:24px 0;">We're thrilled to have you join a growing network of global health professionals. Your skills and insights are what make this community powerful.</p>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works" class="btn btn-primary">
            Explore the platform
          </a>
        </div>
        
        <p style="color:${COLORS.textDark};margin-top:24px;font-size:16px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `;
    
    const taskOwnerContent = `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${user.firstName},</p>
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:24px;">Thank you for registering with <strong style="color:${COLORS.textDark};">GlobalHealth.Works</strong> as a Task Owner.</p>
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:24px;">To maintain the integrity of our network and ensure the security of all members, our team manually reviews every new account. Your application is currently in the queue and will be finalized shortly. We appreciate your patience in helping us keep Global Health Works a trusted space.</p>
        
        <div class="info-box">
          <strong>Account Under Review</strong>
          <p style="margin:8px 0 0;font-size:14px;">Our team is reviewing your registration to verify your account. This typically takes 24-48 hours.</p>
        </div>
        
        <p style="color:${COLORS.textDark};font-weight:600;margin:24px 0 12px;">Once approved, you'll be able to:</p>
        <ul style="color:${COLORS.textLight};margin:0 0 24px;padding-left:20px;">
          <li style="margin-bottom:8px;"><strong style="color:${COLORS.textDark};">Post Tasks:</strong> Create detailed challenges and projects for global health experts to solve.</li>
          <li style="margin-bottom:8px;"><strong style="color:${COLORS.textDark};">Review Proposals:</strong> Receive applications from qualified professionals on our platform.</li>
          <li style="margin-bottom:8px;"><strong style="color:${COLORS.textDark};">Collaborate:</strong> Work directly with selected experts to achieve your goals.</li>
        </ul>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works" class="btn btn-primary">
            Explore the platform
          </a>
        </div>
        
        <p style="color:${COLORS.textDark};margin-top:24px;font-size:16px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `;
    },

  rejectionNotice: (user, reason) =>
    emailLayout({
      title: "Registration Update",
      preheader: "An update regarding your GlobalHealth.Works registration",
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${user.firstName},</p>
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:24px;">Thank you for your interest in joining GlobalHealth.Works.</p>
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:24px;">After reviewing your details, our team was unable to approve your account at this time.</p>
        
        <div class="error-box">
          <strong>Reason:</strong>
          <p style="margin:8px 0 0;">${reason}</p>
        </div>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">If you believe this was a mistake or would like to provide additional information, you're welcome to register again with updated details.</p>
        
        <p style="color:${COLORS.textDark};margin-top:24px;font-size:16px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  proposalSubmissionConfirmation: (applicant, task, proposal) =>
    emailLayout({
      title: "Proposal Submitted",
      preheader: `Your proposal for "${task.title}" was submitted`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${applicant.firstName},</p>
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:24px;">Your proposal for <strong style="color:${COLORS.textDark};">${task.title}</strong> has been successfully submitted.</p>
        <div class="info-box">
          <p style="margin:0;"><strong>Proposed Budget:</strong> ${proposal.proposedBudget ? `$${proposal.proposedBudget.toLocaleString()}` : 'Not specified'}</p>
          <p style="margin:4px 0 0;"><strong>Proposed Duration:</strong> ${proposal.proposedDuration || 'Not specified'}</p>
        </div>
        <p style="color:${COLORS.textDark};margin-top:24px;font-size:16px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  proposalAccepted: (applicant, task) =>
    emailLayout({
      title: "Proposal Accepted!",
      preheader: `Your proposal for "${task.title}" has been accepted`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${applicant.firstName},</p>
        <div class="success-box">
          <strong>Congratulations!</strong> Your proposal for <strong style="color:${COLORS.textDark};">${task.title}</strong> has been accepted.
        </div>
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:24px;">The task owner has selected you to work on this project. You can now communicate directly with them to discuss the next steps.</p>
        <div style="text-align:center;margin-top:24px;">
          <a href="https://globalhealth.works/tasks/${task._id}" class="btn btn-primary">View Task Details</a>
        </div>
        <p style="color:${COLORS.textDark};margin-top:24px;font-size:16px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  proposalRejected: (applicant, task) =>
    emailLayout({
      title: "Proposal Update",
      preheader: `Update regarding your proposal for "${task.title}"`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${applicant.firstName},</p>
        <p style="color:${COLORS.textLight};margin-bottom:24px;">Thank you for your interest in the task below. Unfortunately, the task owner has decided to proceed with another solution provider.</p>
        <div style="background:${COLORS.bgLight};border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:${COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Task</p>
          <h3 style="color:${COLORS.textDark};font-size:16px;margin:0;">${task.title}</h3>
        </div>
        <p style="color:${COLORS.textLight};margin-bottom:24px;">Don't be discouraged! There are many other opportunities waiting for you on GlobalHealth.Works.</p>
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/browse-tasks" class="btn btn-primary">
            Browse Other Tasks
          </a>
        </div>
        <p style="color:${COLORS.textDark};margin-top:24px;font-size:16px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  passwordReset: (user, resetLink) =>
    emailLayout({
      title: "Reset Your Password",
      preheader: "You requested a password reset for your account",
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${user.firstName},</p>
        <p style="color:${COLORS.textLight};margin-bottom:24px;">We received a request to reset your password. Click the button below to create a new password.</p>
        
        <div class="warning-box">
          <strong>This link expires in 1 hour.</strong>
          <p style="margin:8px 0 0;font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="${resetLink}" class="btn btn-accent">
            Reset Password
          </a>
        </div>
        
        <p style="color:${COLORS.textLight};margin-top:32px;font-size:13px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color:${COLORS.primary};word-break:break-all;">${resetLink}</a>
        </p>
      `,
    }),

  taskMatch: (provider, task, matchScore) =>
    emailLayout({
      title: "New Task Match",
      preheader: `A new task matches your profile - ${matchScore.percentage}% match`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Hi ${provider.firstName},</p>
        <p style="color:${COLORS.textLight};margin-bottom:24px;">We found a task that matches your skills and expertise!</p>
        
        <div style="background:linear-gradient(135deg,${COLORS.bgLight} 0%,#D1FAE5 100%);border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
          <p style="color:${COLORS.success};font-weight:700;font-size:32px;margin:0;">${matchScore.percentage}%</p>
          <p style="color:${COLORS.textLight};margin:4px 0 0;font-size:14px;">Match Score</p>
        </div>
        
        <div style="border:1px solid ${COLORS.border};border-radius:12px;padding:24px;margin-bottom:24px;">
          <h3 style="color:${COLORS.textDark};font-size:18px;margin:0 0 12px;">${task.title}</h3>
          <p style="color:${COLORS.textLight};margin:0 0 16px;font-size:14px;">${task.summary}</p>
          
          ${matchScore.matchedSkills?.length > 0 ? `
            <p style="color:${COLORS.textLight};font-size:13px;margin:0 0 8px;"><strong>Matching Skills:</strong></p>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
              ${matchScore.matchedSkills.map(skill => `<span style="background:${COLORS.bgLight};color:${COLORS.textDark};padding:4px 12px;border-radius:20px;font-size:12px;">${skill}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/tasks/${task._id}" class="btn btn-accent">
            View Task Details
          </a>
        </div>
      `,
    }),

  genericNotification: (user, message, link) =>
    emailLayout({
      title: "New Notification",
      preheader: message.substring(0, 100),
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Hi ${user.firstName},</p>
        
        <div class="info-box">
          <p style="margin:0;color:${COLORS.textDark};">${message}</p>
        </div>
        
        ${link ? `
          <div style="text-align:center;margin-top:32px;">
            <a href="https://globalhealth.works${link}" class="btn btn-primary">
              View Details
            </a>
          </div>
        ` : ''}
        
        <p style="color:${COLORS.textLight};margin-top:32px;font-size:14px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  proposalAccepted: (applicant, task) =>
    emailLayout({
      title: "Proposal Accepted!",
      preheader: `Great news! Your proposal for "${task.title}" has been accepted`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${applicant.firstName},</p>
        
        <div class="success-box">
          <strong>Congratulations!</strong> Your proposal has been accepted by the task owner.
        </div>
        
        <div style="background:${COLORS.bgLight};border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:${COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Task</p>
          <h3 style="color:${COLORS.textDark};font-size:16px;margin:0;">${task.title}</h3>
        </div>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">You can now start working on this task. The task owner may reach out to you with further details.</p>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/tasks/${task._id}" class="btn btn-accent">
            View Task
          </a>
        </div>
      `,
    }),

  proposalRejected: (applicant, task) =>
    emailLayout({
      title: "Proposal Update",
      preheader: `Update regarding your proposal for "${task.title}"`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${applicant.firstName},</p>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">Thank you for your interest in the task below. Unfortunately, the task owner has decided to proceed with another solution provider.</p>
        
        <div style="background:${COLORS.bgLight};border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:${COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Task</p>
          <h3 style="color:${COLORS.textDark};font-size:16px;margin:0;">${task.title}</h3>
        </div>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">Don't be discouraged! There are many other opportunities waiting for you on GlobalHealth.Works.</p>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/browse-tasks" class="btn btn-primary">
            Browse Other Tasks
          </a>
        </div>
      `,
    }),

  userSuspensionNotice: (user, reason) =>
    emailLayout({
      title: "Account Suspended",
      preheader: "Your GlobalHealth.Works account has been suspended",
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${user.firstName},</p>
        
        <div class="error-box">
          <strong>Your account has been suspended.</strong>
        </div>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">We regret to inform you that your GlobalHealth.Works account has been suspended by an administrator.</p>
        
        ${reason ? `
        <div class="warning-box">
          <strong>Reason:</strong>
          <p style="margin:8px 0 0;">${reason}</p>
        </div>
        ` : ''}
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">If you believe this was a mistake, please contact our support team for assistance.</p>
        
        <p style="color:${COLORS.textLight};font-size:14px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  userActivationNotice: (user) =>
    emailLayout({
      title: "Account Reactivated",
      preheader: "Your GlobalHealth.Works account has been reactivated",
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${user.firstName},</p>
        
        <div class="success-box">
          <strong>Great news!</strong> Your account has been reactivated.
        </div>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">You now have full access to GlobalHealth.Works again. You can log in and continue using all features.</p>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/login" class="btn btn-accent">
            Log In to Your Account
          </a>
        </div>
        
        <p style="color:${COLORS.textLight};margin-top:32px;font-size:14px;">
          Welcome back,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  userApprovedAdminNotice: (approvedUser, approvingAdmin) =>
    emailLayout({
      title: "User Approved",
      preheader: `${approvedUser.firstName} ${approvedUser.lastName} has been approved`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Hello Admin,</p>
        
        <div class="success-box">
          <strong>A user has been approved and is now active on the platform.</strong>
        </div>
        
        <table class="data-table">
          <tr>
            <td><strong>User</strong></td>
            <td>${approvedUser.firstName} ${approvedUser.lastName}</td>
          </tr>
          <tr>
            <td><strong>Email</strong></td>
            <td>${approvedUser.email}</td>
          </tr>
          <tr>
            <td><strong>Role</strong></td>
            <td>${approvedUser.role}</td>
          </tr>
          <tr>
            <td><strong>Approved By</strong></td>
            <td>${approvingAdmin.firstName} ${approvingAdmin.lastName}</td>
          </tr>
        </table>
        
        <p style="color:${COLORS.textLight};font-size:14px;margin-top:24px;">This is an automated notification for your records.</p>
      `,
    }),

  superAdminApprovalNotice: (approvedUser, approvingAdmin) =>
    emailLayout({
      title: "User Approved by Admin",
      preheader: `${approvingAdmin.firstName} ${approvingAdmin.lastName} approved ${approvedUser.firstName} ${approvedUser.lastName}`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Hello Super Admin,</p>
        
        <div class="info-box">
          <strong>Admin Action:</strong> A user has been approved by an administrator.
        </div>
        
        <table class="data-table">
          <tr>
            <td><strong>User Approved</strong></td>
            <td>${approvedUser.firstName} ${approvedUser.lastName} (${approvedUser.email})</td>
          </tr>
          <tr>
            <td><strong>Role</strong></td>
            <td>${approvedUser.role}</td>
          </tr>
          <tr>
            <td><strong>Approved By</strong></td>
            <td>${approvingAdmin.firstName} ${approvingAdmin.lastName} (${approvingAdmin.email})</td>
          </tr>
          <tr>
            <td><strong>Date</strong></td>
            <td>${new Date().toLocaleString()}</td>
          </tr>
        </table>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/admin/users" class="btn btn-primary">
            View Users
          </a>
        </div>
      `,
    }),

  superAdminRejectionNotice: (rejectedUser, rejectingAdmin, reason) =>
    emailLayout({
      title: "User Rejected by Admin",
      preheader: `${rejectingAdmin.firstName} ${rejectingAdmin.lastName} rejected ${rejectedUser.firstName} ${rejectedUser.lastName}`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Hello Super Admin,</p>
        
        <div class="warning-box">
          <strong>Admin Action:</strong> A user registration has been rejected.
        </div>
        
        <table class="data-table">
          <tr>
            <td><strong>User Rejected</strong></td>
            <td>${rejectedUser.firstName} ${rejectedUser.lastName} (${rejectedUser.email})</td>
          </tr>
          <tr>
            <td><strong>Role</strong></td>
            <td>${rejectedUser.role}</td>
          </tr>
          <tr>
            <td><strong>Rejected By</strong></td>
            <td>${rejectingAdmin.firstName} ${rejectingAdmin.lastName} (${rejectingAdmin.email})</td>
          </tr>
        </table>
        
        <div class="error-box">
          <strong>Reason:</strong>
          <p style="margin:8px 0 0;">${reason}</p>
        </div>
      `,
    }),

  superAdminSuspensionNotice: (suspendedUser, suspendingAdmin, reason) =>
    emailLayout({
      title: "User Suspended by Admin",
      preheader: `${suspendingAdmin.firstName} ${suspendingAdmin.lastName} suspended ${suspendedUser.firstName} ${suspendedUser.lastName}`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Hello Super Admin,</p>
        
        <div class="error-box">
          <strong>Admin Action:</strong> A user account has been suspended.
        </div>
        
        <table class="data-table">
          <tr>
            <td><strong>User Suspended</strong></td>
            <td>${suspendedUser.firstName} ${suspendedUser.lastName} (${suspendedUser.email})</td>
          </tr>
          <tr>
            <td><strong>Role</strong></td>
            <td>${suspendedUser.role}</td>
          </tr>
          <tr>
            <td><strong>Suspended By</strong></td>
            <td>${suspendingAdmin.firstName} ${suspendingAdmin.lastName} (${suspendingAdmin.email})</td>
          </tr>
        </table>
        
        ${reason ? `
        <div class="warning-box">
          <strong>Reason:</strong>
          <p style="margin:8px 0 0;">${reason}</p>
        </div>
        ` : ''}
      `,
    }),

  adminMessageNotification: (receiver, sender, message) =>
    emailLayout({
      title: "New Admin Message",
      preheader: `${sender.firstName} ${sender.lastName} sent you a message`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${receiver.firstName},</p>
        <p style="color:${COLORS.textLight};margin-bottom:24px;">You have a new message from <strong style="color:${COLORS.textDark};">${sender.firstName} ${sender.lastName}</strong> in the admin messaging system.</p>
        
        <div class="info-box">
          <p style="margin:0;font-style:italic;color:${COLORS.textDark};">
            "${message ? message.substring(0, 200) + (message.length > 200 ? '...' : '') : 'Sent an attachment'}"
          </p>
        </div>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/admin/messaging" class="btn btn-primary">
            Open Admin Messages
          </a>
        </div>
        
        <p style="color:${COLORS.textDark};margin-top:24px;font-size:16px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  newDeviceLogin: (user, deviceInfo) =>
    emailLayout({
      title: "New Login Detected",
      preheader: "A new login was detected on your account",
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${user.firstName},</p>
        
        <div class="warning-box">
          <strong>New login to your account</strong>
          <p style="margin:8px 0 0;font-size:14px;">We detected a new login to your GlobalHealth.Works account.</p>
        </div>
        
        <table class="data-table">
          <tr>
            <td><strong>Time</strong></td>
            <td>${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</td>
          </tr>
          <tr>
            <td><strong>Browser</strong></td>
            <td>${deviceInfo.browser || 'Unknown'}</td>
          </tr>
          <tr>
            <td><strong>Device</strong></td>
            <td>${deviceInfo.device || 'Unknown'}</td>
          </tr>
          <tr>
            <td><strong>IP Address</strong></td>
            <td>${deviceInfo.ip || 'Unknown'}</td>
          </tr>
        </table>
        
        <p style="color:${COLORS.textLight};margin:24px 0;">If this was you, no action is needed. If you didn't log in recently, please secure your account immediately.</p>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/settings" class="btn btn-accent">
            Review Account Security
          </a>
        </div>
        
        <p style="color:${COLORS.textLight};margin-top:32px;font-size:14px;">
          Stay safe,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  reportSubmitted: (admin, reporter, reportedItem, reason, itemType) =>
    emailLayout({
      title: "New Report Submitted",
      preheader: `A ${itemType} has been reported for review`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Hello Admin,</p>
        <p style="color:${COLORS.textLight};margin-bottom:24px;">A new report has been submitted and requires your attention.</p>
        
        <div class="error-box">
          <strong>Reported ${itemType}</strong>
        </div>
        
        <table class="data-table">
          <tr>
            <td><strong>Reported By</strong></td>
            <td>${reporter.firstName} ${reporter.lastName} (${reporter.email})</td>
          </tr>
          <tr>
            <td><strong>Item Type</strong></td>
            <td>${itemType}</td>
          </tr>
          <tr>
            <td><strong>Reason</strong></td>
            <td>${reason}</td>
          </tr>
        </table>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/dashboard/admin" class="btn btn-primary">
            Review Report
          </a>
        </div>
      `,
    }),

  reportActionTaken: (user, action, itemType, message) =>
    emailLayout({
      title: "Update on Your Report",
      preheader: `Action has been taken on your ${itemType} report`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${user.firstName},</p>
        <p style="color:${COLORS.textLight};margin-bottom:24px;">We have reviewed your report and taken action.</p>
        
        <div class="${action === 'resolved' ? 'success-box' : 'info-box'}">
          <strong>Action: ${action.charAt(0).toUpperCase() + action.slice(1)}</strong>
        </div>
        
        ${message ? `
        <div style="background:${COLORS.bgLight};border-radius:12px;padding:20px;margin:24px 0;">
          <p style="color:${COLORS.textLight};font-size:12px;text-transform:uppercase;margin:0 0 8px;">Admin Response</p>
          <p style="color:${COLORS.textDark};margin:0;">${message}</p>
        </div>
        ` : ''}
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">Thank you for helping keep GlobalHealth.Works a safe and professional community.</p>
        
        <p style="color:${COLORS.textLight};margin-top:32px;font-size:14px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  forgotPassword: (user, token) =>
    emailLayout({
      title: "Reset Your Password",
      preheader: "Verification code for your password reset request",
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Hello ${user.firstName},</p>
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:24px;">You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
        
        <div class="info-box" style="text-align:center;">
          <p style="margin:0; font-size: 24px; font-weight: bold; letter-spacing: 5px;">${token}</p>
        </div>
        
        <p style="color:${COLORS.textDark};margin:24px 0;font-size:16px;">Please enter this code on the reset password page. This code will expire in 1 hour.</p>
        
        <p style="color:${COLORS.textLight};font-size:14px;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
        
        <p style="color:${COLORS.textDark};margin-top:24px;font-size:16px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  userWarning: (user, reason, adminName) =>
    emailLayout({
      title: "Account Warning",
      preheader: "You have received a warning on your account",
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${user.firstName},</p>
        
        <div class="warning-box">
          <strong>Your account has received a warning</strong>
        </div>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">An administrator has issued a warning regarding your account activity.</p>
        
        <div style="background:${COLORS.bgLight};border-radius:12px;padding:20px;margin:24px 0;">
          <p style="color:${COLORS.textLight};font-size:12px;text-transform:uppercase;margin:0 0 8px;">Reason</p>
          <p style="color:${COLORS.textDark};margin:0;">${reason}</p>
        </div>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">Please review our community guidelines and ensure future activity complies with our terms of service. Continued violations may result in account suspension.</p>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/terms" class="btn btn-primary">
            Review Terms of Service
          </a>
        </div>
        
        <p style="color:${COLORS.textLight};margin-top:32px;font-size:14px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  pendingApprovalReminderUser: (user, attemptNumber) =>
    emailLayout({
      title: "Account Approval Reminder",
      preheader: "Your account is still pending approval",
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${user.firstName},</p>
        
        <div class="info-box">
          <strong>Your account is still being reviewed</strong>
        </div>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">We noticed you tried to log in, but your account is still pending admin approval. Our team is working to review your registration as quickly as possible.</p>
        
        <table class="data-table">
          <tr>
            <td><strong>Account Type</strong></td>
            <td>${user.role === "solutionProvider" ? "Solution Provider" : "Task Owner"}</td>
          </tr>
          <tr>
            <td><strong>Registered</strong></td>
            <td>${new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
          </tr>
        </table>
        
        <p style="color:${COLORS.textLight};margin:24px 0;">The approval process typically takes 24-48 hours. You will receive an email notification as soon as your account is approved.</p>
        
        <div class="warning-box">
          <strong>Need urgent access?</strong>
          <p style="margin:8px 0 0;font-size:14px;">Contact us at info@globalhealth.works and we'll prioritise your review.</p>
        </div>
        
        <p style="color:${COLORS.textLight};margin-top:32px;font-size:14px;">
          Thank you for your patience,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  pendingApprovalReminderAdmin: (user, attemptNumber) =>
    emailLayout({
      title: "User Awaiting Approval - Login Attempt",
      preheader: `${user.firstName} ${user.lastName} is trying to access their account`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Hello Admin,</p>
        
        <div class="warning-box">
          <strong>User Login Attempt - Pending Approval</strong>
          <p style="margin:8px 0 0;font-size:14px;">A user who is awaiting approval has attempted to log in (Attempt #${attemptNumber}).</p>
        </div>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">Please review and approve/reject this user's registration at your earliest convenience.</p>
        
        <table class="data-table">
          <tr>
            <td><strong>Name</strong></td>
            <td style="font-weight:500;">${user.firstName} ${user.lastName}</td>
          </tr>
          <tr>
            <td><strong>Email</strong></td>
            <td>${user.email}</td>
          </tr>
          <tr>
            <td><strong>Role</strong></td>
            <td>${user.role === "solutionProvider" ? "Solution Provider" : "Task Owner"}</td>
          </tr>
          <tr>
            <td><strong>Organisation</strong></td>
            <td>${user.organisationName || "Not specified"}</td>
          </tr>
          <tr>
            <td><strong>Country</strong></td>
            <td>${user.country || "Not specified"}</td>
          </tr>
          <tr>
            <td><strong>Registered</strong></td>
            <td>${new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
          </tr>
        </table>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/dashboard/admin" class="btn btn-accent">
            Review User Now
          </a>
        </div>
        
        <p style="color:${COLORS.textLight};margin-top:24px;font-size:13px;">
          <em>This is reminder ${attemptNumber} of 2. The user will not receive further reminders after this.</em>
        </p>
      `,
    }),

  forgotPassword: (user, token) =>
    emailLayout({
      title: "Reset Your Password",
      preheader: "Verification code for your password reset request",
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Hello ${user.firstName},</p>
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:24px;">You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
        
        <div class="info-box" style="text-align:center;">
          <p style="margin:0; font-size: 24px; font-weight: bold; letter-spacing: 5px;">${token}</p>
        </div>
        
        <p style="color:${COLORS.textDark};margin:24px 0;font-size:16px;">Please enter this code on the reset password page. This code will expire in 1 hour.</p>
        
        <p style="color:${COLORS.textLight};font-size:14px;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
        
        <p style="color:${COLORS.textDark};margin-top:24px;font-size:16px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  newMessageNotification: (receiver, sender, messageText, conversationId) =>
    emailLayout({
      title: "New Message",
      preheader: `${sender.firstName} ${sender.lastName} sent you a message`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:16px;">Hi ${receiver.firstName},</p>
        <p style="color:${COLORS.textLight};margin-bottom:16px;">You have a new message from <strong style="color:${COLORS.textDark};">${sender.firstName} ${sender.lastName}</strong>.</p>
        
        <div class="info-box">
          <p style="margin:0;font-style:italic;color:${COLORS.textDark};">
            "${messageText ? messageText.substring(0, 200) + (messageText.length > 200 ? '...' : '') : 'Sent an attachment'}"
          </p>
        </div>
        
        <p style="color:${COLORS.textLight};margin:16px 0 16px;">You can view and reply to this message by clicking below.</p>
        
        <div style="text-align:center;">
          <a href="https://globalhealth.works/messages/${conversationId}" class="btn btn-primary">
            View Message
          </a>
        </div>
        
        <p style="color:${COLORS.textDark};margin-top:20px;font-size:14px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),

  proposalWithdrawn: (applicant, task) =>
    emailLayout({
      title: "Proposal Withdrawn",
      preheader: `You've withdrawn your proposal for "${task.title}"`,
      content: `
        <p style="font-size:16px;color:${COLORS.textDark};margin-bottom:20px;">Dear ${applicant.firstName},</p>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">This is to confirm that you have withdrawn your proposal for the following task:</p>
        
        <div style="background:${COLORS.bgLight};border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:${COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Task</p>
          <h3 style="color:${COLORS.textDark};font-size:16px;margin:0;">${task.title}</h3>
        </div>
        
        <div class="info-box">
          <strong>Changed your mind?</strong>
          <p style="margin:8px 0 0;font-size:14px;">You can submit a new proposal for this task at any time, as long as the task is still open.</p>
        </div>
        
        <p style="color:${COLORS.textLight};margin-bottom:24px;">If you have any questions about this task or would like to explore other opportunities, feel free to browse our available tasks.</p>
        
        <div style="text-align:center;margin-top:32px;">
          <a href="https://globalhealth.works/tasks/${task._id}" class="btn btn-primary">
            View Task
          </a>
        </div>
        
        <p style="color:${COLORS.textDark};margin-top:24px;font-size:14px;">
          Best regards,<br>
          <strong style="color:${COLORS.textDark};">The GlobalHealth.Works Team</strong>
        </p>
      `,
    }),
};

module.exports = { sendMail, Templates, emailLayout };
