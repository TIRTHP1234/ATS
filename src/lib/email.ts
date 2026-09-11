import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// 1. Core Reusable Email Transporter
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const { to, subject, html, text } = options;

  if (!to || !to.trim()) {
    console.warn('⚠️ [Email Engine] No recipient address specified. Skipping email dispatch.');
    return { success: false };
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"Costaff ATS Notifications" <${user || 'no-reply@costaff.com'}>`;

  // Fallback console logging if SMTP environment variables are not yet configured
  if (!host || !user || !pass) {
    console.log('\n=================== 📧 [SMTP EMAIL ENGINE DISPATCH (SIMULATED)] ===================');
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`FROM: ${from}`);
    console.log('----------------------------------------------------------------------------------');
    console.log(text || html.replace(/<[^>]+>/g, ''));
    console.log('==================================================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, '')
    });

    console.log(`✅ [Email Engine] Email successfully dispatched to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Email Engine] Error sending email via SMTP:', error);
    return { success: false };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   REUSABLE HTML EMAIL TEMPLATES
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * HTML Template for Account Manager (AM) Demand Assignment Notification
 */
export function getAmDemandAssignedEmailHtml(demand: {
  request_id: string;
  client_name?: string;
  skill_description: string;
  role_category?: string;
  priority?: string;
  status?: string;
  budget_min?: number | null;
  budget_max?: number | null;
  num_positions?: number;
  experience_level?: string;
  locations?: string[] | string;
  notes?: string;
  am_name?: string;
}) {
  const locationsStr = Array.isArray(demand.locations) ? demand.locations.join(', ') : (demand.locations || 'Pan India');
  const budgetStr = (demand.budget_min || demand.budget_max)
    ? `₹${demand.budget_min || 0}L - ₹${demand.budget_max || 0}L LPA`
    : 'Not Specified';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #0b1727 0%, #1e293b 100%); color: #ffffff; padding: 24px; text-align: left; }
      .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #f59e0b; }
      .header p { margin: 4px 0 0 0; font-size: 13px; color: #94a3b8; }
      .content { padding: 24px; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
      .badge-high { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
      .grid-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
      .grid-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
      .grid-table td.label { font-weight: 600; color: #64748b; width: 35%; background: #f8fafc; }
      .grid-table td.value { font-weight: 600; color: #0f172a; }
      .notes-box { background: #fffbeb; border: 1px solid #fde68a; padding: 14px; border-radius: 8px; font-size: 13px; color: #92400e; margin-top: 16px; }
      .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>COSTAFF ENTERPRISE ATS</h1>
        <p>New Client Demand Requirement Assignment</p>
      </div>
      <div class="content">
        <span class="badge badge-high">Priority: ${demand.priority || 'High'}</span>
        <h2 style="font-size: 16px; margin: 0 0 12px 0; color: #0f172a;">Hello ${demand.am_name || 'Account Manager'},</h2>
        <p style="font-size: 13px; line-height: 1.5; color: #475569; margin-bottom: 16px;">
          A client requirement has been assigned to you in Costaff ATS. Please review the requirement parameters below and coordinate with your TA sourcing team.
        </p>

        <table class="grid-table">
          <tr><td class="label">Internal Request ID</td><td class="value" style="color: #2563eb;">${demand.request_id}</td></tr>
          <tr><td class="label">Client Name</td><td class="value">${demand.client_name || 'Costaff Client'}</td></tr>
          <tr><td class="label">Skill / Requirement</td><td class="value">${demand.skill_description}</td></tr>
          <tr><td class="label">Role Type</td><td class="value">${demand.role_category || 'Permanent'}</td></tr>
          <tr><td class="label">Budget Range</td><td class="value">${budgetStr}</td></tr>
          <tr><td class="label">Experience Level</td><td class="value">${demand.experience_level || 'Mid-Senior'}</td></tr>
          <tr><td class="label">Open Positions</td><td class="value">${demand.num_positions || 1} Position(s)</td></tr>
          <tr><td class="label">Work Locations</td><td class="value">${locationsStr}</td></tr>
        </table>

        ${demand.notes ? `
          <div class="notes-box">
            <strong>📝 Mandate Notes / Client Specifications:</strong><br>${demand.notes}
          </div>
        ` : ''}
      </div>
      <div class="footer">
        Costaff Enterprise ATS • Automated Notification System • Please do not reply directly to this email.
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * HTML Template for Candidate Interview Invitation
 */
export function getCandidateInterviewEmailHtml(interview: {
  candidate_name: string;
  demand_request_id?: string;
  skill_tested: string;
  level: string;
  mode: string;
  scheduled_date: string;
  scheduled_time: string;
  interviewer_name: string;
  meeting_link?: string;
}) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #0b1727 0%, #1e293b 100%); color: #ffffff; padding: 24px; text-align: left; }
      .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #f59e0b; }
      .header p { margin: 4px 0 0 0; font-size: 13px; color: #94a3b8; }
      .content { padding: 24px; }
      .grid-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
      .grid-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
      .grid-table td.label { font-weight: 600; color: #64748b; width: 35%; background: #f8fafc; }
      .grid-table td.value { font-weight: 600; color: #0f172a; }
      .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; margin-top: 16px; font-size: 14px; text-align: center; }
      .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>COSTAFF RECRUITMENT</h1>
        <p>Official Interview Schedule & Call Details</p>
      </div>
      <div class="content">
        <h2 style="font-size: 16px; margin: 0 0 12px 0; color: #0f172a;">Dear ${interview.candidate_name},</h2>
        <p style="font-size: 13px; line-height: 1.5; color: #475569; margin-bottom: 16px;">
          Congratulations! Your profile has been shortlisted, and an interview round has been scheduled for you. Please find the complete schedule details below:
        </p>

        <table class="grid-table">
          <tr><td class="label">Requisition ID</td><td class="value" style="color: #2563eb;">${interview.demand_request_id || 'CSF-2026-0001'}</td></tr>
          <tr><td class="label">Skill / Technical Domain</td><td class="value">${interview.skill_tested}</td></tr>
          <tr><td class="label">Interview Round / Level</td><td class="value">${interview.level}</td></tr>
          <tr><td class="label">Interview Mode</td><td class="value">${interview.mode}</td></tr>
          <tr><td class="label">Date & Time</td><td class="value" style="color: #059669;">${interview.scheduled_date} at ${interview.scheduled_time}</td></tr>
          <tr><td class="label">Interviewer / SPOC</td><td class="value">${interview.interviewer_name}</td></tr>
        </table>

        ${interview.meeting_link ? `
          <div style="text-align: center; margin-top: 20px;">
            <a href="${interview.meeting_link}" class="btn" target="_blank">🎥 Join Video Call Interview</a>
          </div>
        ` : ''}
      </div>
      <div class="footer">
        Costaff Recruitment Team • Please log in 5 minutes prior to the scheduled start time.
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * HTML Template for AM Interview Booking Alert
 */
export function getAmInterviewNotificationEmailHtml(interview: {
  candidate_name: string;
  demand_request_id?: string;
  skill_tested: string;
  level: string;
  mode: string;
  scheduled_date: string;
  scheduled_time: string;
  interviewer_name: string;
  meeting_link?: string;
}) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #0b1727 0%, #1e293b 100%); color: #ffffff; padding: 24px; text-align: left; }
      .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #f59e0b; }
      .header p { margin: 4px 0 0 0; font-size: 13px; color: #94a3b8; }
      .content { padding: 24px; }
      .grid-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
      .grid-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
      .grid-table td.label { font-weight: 600; color: #64748b; width: 35%; background: #f8fafc; }
      .grid-table td.value { font-weight: 600; color: #0f172a; }
      .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>COSTAFF ENTERPRISE ATS</h1>
        <p>Candidate Interview Slot Notification for AM</p>
      </div>
      <div class="content">
        <h2 style="font-size: 16px; margin: 0 0 12px 0; color: #0f172a;">Account Manager Alert,</h2>
        <p style="font-size: 13px; line-height: 1.5; color: #475569; margin-bottom: 16px;">
          An interview slot has been booked for requirement <strong>${interview.demand_request_id || 'CSF-2026-0001'}</strong>.
        </p>

        <table class="grid-table">
          <tr><td class="label">Candidate Name</td><td class="value" style="color: #2563eb;">${interview.candidate_name}</td></tr>
          <tr><td class="label">Request ID</td><td class="value">${interview.demand_request_id || 'CSF-2026-0001'}</td></tr>
          <tr><td class="label">Round / Level</td><td class="value">${interview.level}</td></tr>
          <tr><td class="label">Skill Tested</td><td class="value">${interview.skill_tested}</td></tr>
          <tr><td class="label">Scheduled Time</td><td class="value" style="color: #059669;">${interview.scheduled_date} at ${interview.scheduled_time}</td></tr>
          <tr><td class="label">Interviewer / SPOC</td><td class="value">${interview.interviewer_name}</td></tr>
        </table>
      </div>
      <div class="footer">
        Costaff Enterprise ATS • Automated Notification System
      </div>
    </div>
  </body>
  </html>
  `;
}
