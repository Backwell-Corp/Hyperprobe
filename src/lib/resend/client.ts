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
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #18181b; line-height: 1.5; padding: 20px; background-color: #fcfcfc; }
          .container { max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
          .accent-bar { height: 4px; background-color: #C0392B; }
          .header { background: #09090b; padding: 24px; color: #ffffff; }
          .header h1 { margin: 0; font-size: 18px; font-weight: 600; color: #ffffff; font-family: Georgia, serif; }
          .header span { color: #C0392B; }
          .content { padding: 32px 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 10px 12px; background: #f4f4f5; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e4e4e7; text-transform: uppercase; color: #71717a; }
          td { padding: 12px; font-size: 14px; border-bottom: 1px solid #e4e4e7; color: #27272a; }
          .footer { background: #fafafa; padding: 20px; text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #e4e4e7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="accent-bar"></div>
          <div class="header">
            <h1>Hyper<span>probe</span> &middot; Lead Alert</h1>
          </div>
          <div class="content">
            <p style="margin-top: 0; font-size: 15px;">A new developer has submitted a demo request application.</p>
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
                <td><a href="mailto:${lead.email}" style="color: #C0392B; text-decoration: none;">${lead.email}</a></td>
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
                <td><code style="background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-size: 13px;">${lead.backend_language}</code></td>
              </tr>
              <tr>
                <td><strong>Source Page</strong></td>
                <td><code style="background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-size: 13px;">${lead.source_page}</code></td>
              </tr>
              <tr>
                <td><strong>Timestamp</strong></td>
                <td>${timestamp}</td>
              </tr>
            </table>
          </div>
          <div class="footer">
            &copy; 2026 Hyperprobe. Built for production telemetry and debugging.
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
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #27272a; background-color: #fafafa; line-height: 1.6; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 30px auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
          .accent-bar { height: 4px; background-color: #C0392B; }
          .header { background: #09090b; padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; font-family: Georgia, serif; letter-spacing: -0.02em; }
          .header span { color: #C0392B; }
          .content { padding: 36px 28px; }
          .content h2 { color: #18181b; font-family: Georgia, serif; font-size: 20px; font-weight: 500; margin-top: 0; margin-bottom: 16px; }
          .content p { font-size: 14px; color: #52525b; margin-bottom: 20px; }
          .cta-container { text-align: center; margin: 30px 0; }
          .cta-btn { display: inline-block; padding: 12px 28px; background-color: #C0392B; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background-color 0.2s; box-shadow: 0 2px 4px rgba(192, 57, 43, 0.15); }
          .details-box { background: #fafafa; border-left: 3px solid #C0392B; padding: 16px; margin: 24px 0; border-radius: 0 6px 6px 0; }
          .details-box h3 { margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; font-weight: 700; }
          .details-box p { margin: 0; font-size: 13px; color: #27272a; font-weight: 500; }
          .footer { background: #fafafa; padding: 20px; text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #e4e4e7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="accent-bar"></div>
          <div class="header">
            <h1>Hyper<span>probe</span></h1>
          </div>
          <div class="content">
            <h2>Thanks for your interest, ${lead.name}!</h2>
            <p>We have successfully received your demo request application. Our engineering team is currently reviewing it to customize your walk-through experience.</p>
            
            <div class="details-box">
              <h3>Configuration Confirmed</h3>
              <p>Primary focus: <strong>${lead.backend_language} production telemetry</strong></p>
            </div>

            <p>To fast-track your request and immediately schedule a live 1-1 walkthrough tailored to your stack, please use the button below to book a time slot:</p>
            
            <div class="cta-container">
              <a href="https://calendly.com/shailendra-gco-hypertest/shailendra-1-1" class="cta-btn" target="_blank">Book a 1-1 Walkthrough</a>
            </div>

            <p style="margin-bottom: 0; font-size: 13px; color: #71717a;">If you have any specific requirements or environment constraints, you can reply directly to this email.</p>
          </div>
          <div class="footer">
            &copy; 2026 Hyperprobe. Built for production systems debugging.
          </div>
        </div>
      </body>
    </html>
  `;

  // Perform parallel email delivery using mail.hyperprobe.co sender domain
  const [adminResult, customerResult] = await Promise.all([
    resend.emails.send({
      from: 'Hyperprobe Alerts <alerts@mail.hyperprobe.co>',
      to: adminEmail,
      subject: `[Lead Alert] Demo Requested by ${lead.name} (${lead.company || 'No Company'})`,
      html: adminEmailBody,
    }),
    resend.emails.send({
      from: 'Hyperprobe <team@mail.hyperprobe.co>',
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
