import { getSupabaseClient } from '../../src/lib/supabase/client';
import { sendDemoLeadEmails } from '../../src/lib/resend/client';

const ALLOWED_LANGUAGES = [
  'TypeScript', 'Python', 'Java', 'Node.js', 'Kotlin', 'PHP', 
  'Scala', 'Go', 'Rust', 'C#', 'C++', 'Others'
];

export const onRequestPost = async (context: {
  request: Request;
  env: Record<string, any>;
}) => {
  try {
    const payload: any = await context.request.json();
    const { name, email, company, phone_number, backend_language, source_page } = payload;

    // 1. Server-side validations
    const errors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.name = 'Name is required';
    } else if (name.length > 255) {
      errors.name = 'Name must be under 255 characters';
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Invalid email format';
      } else if (email.length > 255) {
        errors.email = 'Email must be under 255 characters';
      }
    }

    if (company && (typeof company !== 'string' || company.length > 255)) {
      errors.company = 'Company name must be under 255 characters';
    }

    if (phone_number && (typeof phone_number !== 'string' || phone_number.length > 100)) {
      errors.phone_number = 'Phone number is too long';
    }

    if (!backend_language || !ALLOWED_LANGUAGES.includes(backend_language)) {
      errors.backend_language = 'A valid primary backend language is required';
    }

    if (!source_page || typeof source_page !== 'string' || source_page.trim() === '') {
      errors.source_page = 'Source page tracking is missing';
    }

    if (Object.keys(errors).length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Server validation failed.', 
          errors 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Adapt context for existing utilities
    const adaptedContext = {
      locals: {
        runtime: {
          env: context.env
        }
      }
    };

    // 2. Save data to Supabase database
    const supabase = getSupabaseClient(adaptedContext);
    const { error: dbError } = await supabase
      .from('website_leads')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company ? company.trim() : null,
        phone_number: phone_number ? phone_number.trim() : null,
        backend_language,
        source_page: source_page.trim()
      });

    if (dbError) {
      console.error('Supabase DB Insert Error:', dbError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Database storage operation failed. Please try again later.' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Send Notification & Confirmation Emails using Resend
    try {
      await sendDemoLeadEmails({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company ? company.trim() : undefined,
        phone_number: phone_number ? phone_number.trim() : undefined,
        backend_language,
        source_page: source_page.trim()
      }, adaptedContext);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Submit Demo Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'An internal server error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
