import { Resend } from 'resend';
import type { APIContext } from 'astro';
import { getRequiredEnv } from '../utils/env';

export interface DemoLeadData {
  name: string;
  email: string;
  company?: string;
  phone_number?: string;
  backend_language: string;
  source_page: string;
}

/**
 * Creates and returns a Resend client.
 * Instantiated per-request to ensure Cloudflare environment bindings are correctly read.
 */
export function getResendClient(context?: APIContext | { locals: { runtime?: { env?: Record<string, any> } } }) {
  const apiKey = getRequiredEnv('RESEND_API_KEY', context);
  return new Resend(apiKey);
}

/**
 * Sends notification email to the administrator and a confirmation email to the lead.
 */
export async function sendDemoLeadEmails(
  lead: DemoLeadData,
  context?: APIContext | { locals: { runtime?: { env?: Record<string, any> } } }
) {
  const resend = getResendClient(context);
  const adminEmail = getRequiredEnv('ADMIN_EMAIL', context);
  const timestamp = new Date().toISOString();

  // 1. Send admin notification email
  const adminEmailBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Demo Request</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; line-height: 1.5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
          .header { background: #09090b; padding: 24px; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 600; color: #10b981; }
          .content { padding: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { text-align: left; padding: 8px 12px; background: #f3f4f6; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
          td { padding: 12px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Hyperprobe Alert: New Demo Request</h1>
          </div>
          <div class="content">
            <p>A new lead has requested a product demo of Hyperprobe.</p>
            <table>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
              <tr>
                <td><strong>Name</strong></td>
                <td>${lead.name}</td>
              </tr>
              <tr>
                <td><strong>Email</strong></td>
                <td><a href="mailto:${lead.email}">${lead.email}</a></td>
              </tr>
              <tr>
                <td><strong>Company</strong></td>
                <td>${lead.company || 'N/A'}</td>
              </tr>
              <tr>
                <td><strong>Phone Number</strong></td>
                <td>${lead.phone_number || 'N/A'}</td>
              </tr>
              <tr>
                <td><strong>Backend Language</strong></td>
                <td><code>${lead.backend_language}</code></td>
              </tr>
              <tr>
                <td><strong>Source Page</strong></td>
                <td><code>${lead.source_page}</code></td>
              </tr>
              <tr>
                <td><strong>Timestamp</strong></td>
                <td>${timestamp}</td>
              </tr>
            </table>
          </div>
          <div class="footer">
            &copy; 2026 Hyperprobe. Real-time telemetry & production debugging.
          </div>
        </div>
      </body>
    </html>
  `;

  // 2. Send customer confirmation email
  const customerEmailBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Demo Request Received</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f4f4f5; background: #09090b; line-height: 1.6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 40px auto; background: #18181b; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          .header { background: #09090b; padding: 32px 24px; text-align: center; border-bottom: 1px solid #27272a; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; color: #ffffff; }
          .header span { color: #10b981; }
          .content { padding: 32px 24px; }
          .content p { font-size: 15px; color: #a1a1aa; }
          .accent-box { background: #09090b; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0; }
          .accent-box h3 { margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #ffffff; }
          .accent-box p { margin: 0; font-size: 14px; color: #a1a1aa; }
          .footer { background: #09090b; padding: 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Hyper<span>probe</span></h1>
          </div>
          <div class="content">
            <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Thanks for your interest, ${lead.name}!</h2>
            <p>We've successfully received your request for a Hyperprobe product demo.</p>
            <p>Our engineering-focused team will review your application and reach out shortly to schedule a live walk-through tailored to your stack.</p>
            
            <div class="accent-box">
              <h3>Configuration Confirmed</h3>
              <p>Primary focus: <strong>${lead.backend_language} debugging in production</strong></p>
            </div>

            <p style="margin-bottom: 0;">In the meantime, feel free to read through our documentation or think about the trickiest production issue currently affecting your microservices.</p>
          </div>
          <div class="footer">
            &copy; 2026 Hyperprobe. Built for engineers who debug in production.
          </div>
        </div>
      </body>
    </html>
  `;

  // Perform parallel email delivery
  const [adminResult, customerResult] = await Promise.all([
    resend.emails.send({
      from: 'Hyperprobe Alerts <alerts@updates.hyperprobe.io>',
      to: adminEmail,
      subject: `[Lead Alert] Demo Requested by ${lead.name} (${lead.company || 'No Company'})`,
      html: adminEmailBody,
    }),
    resend.emails.send({
      from: 'Hyperprobe <team@updates.hyperprobe.io>',
      to: lead.email,
      subject: 'Your Hyperprobe Demo Request',
      html: customerEmailBody,
    })
  ]);

  if (adminResult.error) {
    console.error('Error sending admin notification email:', adminResult.error);
  }
  if (customerResult.error) {
    console.error('Error sending customer confirmation email:', customerResult.error);
  }

  return {
    adminEmailId: adminResult.data?.id || null,
    customerEmailId: customerResult.data?.id || null,
    errors: {
      admin: adminResult.error,
      customer: customerResult.error
    }
  };
}
