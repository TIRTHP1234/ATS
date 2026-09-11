import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to } = body;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { error: 'Valid recipient email address is required.' },
        { status: 400 }
      );
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const isConfigured = !!(host && user && pass);

    const result = await sendEmail({
      to: to.trim(),
      subject: `[Costaff ATS] SMTP Connection Verification Test`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; margin: 0; }
            .card { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
            .header h2 { margin: 0; color: #1e293b; font-size: 18px; }
            .status { display: inline-block; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 12px; text-transform: uppercase; background: #dcfce7; color: #166534; margin: 12px 0; }
            .info-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
            .info-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
            .info-table td.label { color: #64748b; font-weight: 600; width: 40%; }
            .info-table td.val { color: #0f172a; font-weight: bold; }
            .footer { margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2>COSTAFF ENTERPRISE ATS</h2>
            </div>
            <p style="font-size: 14px; color: #334155;">
              This is an automated test message to verify that your <strong>SMTP Mail Delivery Engine</strong> is properly configured and functional.
            </p>
            <div class="status">✅ SMTP Verification Successful</div>
            <table class="info-table">
              <tr><td class="label">Recipient Email</td><td class="val">${to.trim()}</td></tr>
              <tr><td class="label">SMTP Server Host</td><td class="val">${host || 'Not Set (Console Simulated Mode)'}</td></tr>
              <tr><td class="label">SMTP Port</td><td class="val">${process.env.SMTP_PORT || '587'}</td></tr>
              <tr><td class="label">Dispatch Mode</td><td class="val">${isConfigured ? 'Live SMTP Transport' : 'Simulated Terminal Engine'}</td></tr>
              <tr><td class="label">Timestamp</td><td class="val">${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST</td></tr>
            </table>
            <div class="footer">
              Costaff ATS Automated System Diagnostics • Generated automatically by system test
            </div>
          </div>
        </body>
        </html>
      `,
      text: `[Costaff ATS] SMTP Test Successful!\nRecipient: ${to.trim()}\nTimestamp: ${new Date().toISOString()}`
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        simulated: result.simulated || !isConfigured,
        messageId: result.messageId || null,
        message: result.simulated || !isConfigured
          ? 'SMTP credentials are not configured in .env.local. Test email was logged to server console (Simulated Mode).'
          : `Test email disapched successfully via SMTP! Message ID: ${result.messageId}`
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send test email. Please check your SMTP configuration in .env.local and server console logs.'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in /api/test-email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
