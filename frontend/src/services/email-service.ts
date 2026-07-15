/**
 * Email Notification Service
 *
 * All email sending is server-side only via /api/email.
 * Supports SendGrid (primary) with a Resend fallback.
 * Never import this on the client — it exposes template logic only.
 * The actual API key usage happens in the API route.
 */

export type EmailTemplate =
  | 'teacher_approved'
  | 'teacher_rejected'
  | 'enrollment_confirmed'
  | 'course_published'
  | 'assignment_graded'
  | 'certificate_issued'
  | 'password_reset'
  | 'welcome'
  | 'live_session_reminder';

export interface EmailPayload {
  to: string;
  template: EmailTemplate;
  data: Record<string, string | number | boolean>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ── Email templates ───────────────────────────────────────────────────────────

function buildSubject(template: EmailTemplate, data: Record<string, any>): string {
  switch (template) {
    case 'welcome':
      return `Welcome to Fusion8, ${data.name}!`;
    case 'teacher_approved':
      return 'Your Fusion8 Instructor Application — Approved';
    case 'teacher_rejected':
      return 'Your Fusion8 Instructor Application — Update';
    case 'enrollment_confirmed':
      return `You're enrolled in ${data.courseTitle}`;
    case 'course_published':
      return `Your course "${data.courseTitle}" is now live`;
    case 'assignment_graded':
      return `Assignment graded: ${data.assignmentTitle}`;
    case 'certificate_issued':
      return `Your Fusion8 Certificate is Ready — ${data.courseTitle}`;
    case 'password_reset':
      return 'Reset your Fusion8 password';
    case 'live_session_reminder':
      return `Live Session Alert: "${data.title}" — ${data.date}`;
    default:
      return 'Notification from Fusion8';
  }
}

function buildHtmlBody(template: EmailTemplate, data: Record<string, any>): string {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #0A0A0A;
    max-width: 600px;
    margin: 0 auto;
    padding: 0;
  `;

  const headerBg = '#0A0A0A';
  const accentColor = '#E8461E';

  const header = `
    <div style="background: ${headerBg}; padding: 32px 40px 24px;">
      <div style="color: ${accentColor}; font-size: 11px; letter-spacing: 4px; font-weight: 700; margin-bottom: 4px;">FUSION8</div>
      <div style="color: #6B7280; font-size: 9px; letter-spacing: 2px;">HARDTECH ECOSYSTEM</div>
    </div>
    <div style="background: ${accentColor}; height: 3px;"></div>
  `;

  const footer = `
    <div style="background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 24px 40px; text-align: center;">
      <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Fusion8 — Bamenda, Northwest Region, Cameroon<br/>
        <a href="https://fusion8.tech" style="color: ${accentColor}; text-decoration: none;">fusion8.tech</a>
      </p>
    </div>
  `;

  function wrap(content: string): string {
    return `<div style="${baseStyle}">${header}<div style="padding: 32px 40px;">${content}</div>${footer}</div>`;
  }

  const h1 = (text: string) =>
    `<h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px; color: #0A0A0A;">${text}</h1>`;
  const p = (text: string) =>
    `<p style="font-size: 15px; color: #374151; margin: 0 0 16px;">${text}</p>`;
  const btn = (text: string, url: string) =>
    `<a href="${url}" style="display: inline-block; background: ${accentColor}; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 8px 0;">${text}</a>`;
  const badge = (text: string) =>
    `<span style="display: inline-block; background: ${accentColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 1px;">${text.toUpperCase()}</span>`;

  switch (template) {
    case 'welcome':
      return wrap(`
        ${h1(`Welcome to Fusion8, ${data.name}!`)}
        ${p("You're now part of Africa's hardtech innovation ecosystem. Build real things, work on real problems, and join a community of engineers, innovators, and founders.")}
        ${p("Here's how to get started:")}
        <ul style="color: #374151; padding-left: 20px; margin: 0 0 20px;">
          <li style="margin-bottom: 8px;">Browse our <strong>Course Catalog</strong> and enroll in your first course</li>
          <li style="margin-bottom: 8px;">Explore the <strong>Innovation Hub</strong> and join a project team</li>
          <li style="margin-bottom: 8px;">Apply to the next <strong>Incubation Cohort</strong></li>
        </ul>
        ${btn('Go to Dashboard', `https://fusion8.tech/${data.role}/dashboard`)}
      `);

    case 'teacher_approved':
      return wrap(`
        ${badge('Application Approved')}
        <br/><br/>
        ${h1('Congratulations! Your Application Has Been Approved')}
        ${p(`Dear ${data.name},`)}
        ${p('Your Fusion8 instructor application has been reviewed and approved. You now have full access to the Instructor Portal, where you can create courses, manage your curriculum, and connect with students.')}
        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <strong style="display: block; margin-bottom: 8px; color: #0A0A0A;">Your Matricule ID</strong>
          <span style="font-family: monospace; font-size: 18px; color: ${accentColor}; font-weight: 700;">${data.matricule ?? 'Assigned upon first login'}</span>
        </div>
        ${btn('Access Instructor Portal', 'https://fusion8.tech/teacher/dashboard')}
      `);

    case 'teacher_rejected':
      return wrap(`
        ${h1('Update on Your Instructor Application')}
        ${p(`Dear ${data.name},`)}
        ${p('Thank you for your interest in becoming a Fusion8 instructor. After careful review, we are unable to approve your application at this time.')}
        ${data.reason ? `<div style="background: #FEF2F2; border-left: 3px solid ${accentColor}; padding: 16px 20px; margin: 20px 0;"><strong>Feedback:</strong> ${data.reason}</div>` : ''}
        ${p('You are welcome to re-apply in the future. If you have questions, please contact our team.')}
        ${btn('Contact Support', 'mailto:support@fusion8.tech')}
      `);

    case 'enrollment_confirmed':
      return wrap(`
        ${badge('Enrolled')}
        <br/><br/>
        ${h1(`You're now enrolled in ${data.courseTitle}`)}
        ${p(`Hi ${data.name},`)}
        ${p(`Your payment has been confirmed and your enrollment is now active. You have full access to all lessons, materials, and resources for this course.`)}
        <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <strong style="display: block; margin-bottom: 4px;">Course:</strong> ${data.courseTitle}<br/>
          <strong style="display: block; margin-top: 12px; margin-bottom: 4px;">Payment Reference:</strong>
          <span style="font-family: monospace; color: ${accentColor};">${data.paymentReference}</span>
        </div>
        ${btn('Start Learning', `https://fusion8.tech/student/courses/${data.courseId}`)}
      `);

    case 'certificate_issued':
      return wrap(`
        ${badge('Certificate Ready')}
        <br/><br/>
        ${h1('Your Fusion8 Certificate is Ready!')}
        ${p(`Congratulations, ${data.name}!`)}
        ${p(`You have successfully completed <strong>${data.courseTitle}</strong>. Your completion certificate is now available for download.`)}
        <div style="background: #0A0A0A; border-radius: 8px; padding: 24px; margin: 20px 0; text-align: center;">
          <div style="color: ${accentColor}; font-size: 11px; letter-spacing: 3px; font-weight: 700; margin-bottom: 4px;">FUSION8 CERTIFICATE</div>
          <div style="color: white; font-size: 20px; font-weight: 700; margin: 8px 0;">${data.name}</div>
          <div style="color: #9CA3AF; font-size: 13px;">${data.courseTitle}</div>
          <div style="color: ${accentColor}; font-size: 11px; margin-top: 12px; font-family: monospace;">ID: ${data.certId}</div>
        </div>
        ${btn('Download Certificate', data.downloadUrl)}
        <br/><br/>
        ${p(`<a href="${data.verificationUrl}" style="color: ${accentColor};">Verify this certificate</a> — share the link with employers or institutions.`)}
      `);

    case 'assignment_graded':
      return wrap(`
        ${badge('Assignment Graded')}
        <br/><br/>
        ${h1(`Your assignment has been graded`)}
        ${p(`Hi ${data.name},`)}
        ${p(`Your instructor has graded your submission for <strong>${data.assignmentTitle}</strong>.`)}
        <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <strong>Grade:</strong> <span style="color: ${accentColor}; font-size: 20px; font-weight: 700;">${data.grade}</span><br/>
          ${data.feedback ? `<strong style="display: block; margin-top: 12px;">Feedback:</strong> ${data.feedback}` : ''}
        </div>
        ${btn('View Submission', `https://fusion8.tech/student/assignments`)}
      `);

    case 'live_session_reminder':
      return wrap(`
        ${badge('Live Session')}
        <br/><br/>
        ${h1(`"${data.title}" — You're Invited!`)}
        ${p(`Hi ${data.name},`)}
        ${p(`Your instructor has scheduled a live session for your course. Don't miss it!`)}
        <div style="background: #0A0A0A; border-radius: 10px; padding: 24px 28px; margin: 20px 0;">
          <table style="width:100%; border-collapse: collapse;">
            <tr>
              <td style="color: #6B7280; font-size: 11px; letter-spacing: 1px; font-weight: 700; padding-bottom: 4px;">SESSION</td>
              <td style="color: white; font-size: 15px; font-weight: 700;">${data.title}</td>
            </tr>
            <tr>
              <td style="color: #6B7280; font-size: 11px; letter-spacing: 1px; font-weight: 700; padding-top: 12px; padding-bottom: 4px;">DATE</td>
              <td style="color: white; font-size: 14px; padding-top: 12px;">${data.date}</td>
            </tr>
            <tr>
              <td style="color: #6B7280; font-size: 11px; letter-spacing: 1px; font-weight: 700; padding-top: 12px; padding-bottom: 4px;">TIME</td>
              <td style="color: ${accentColor}; font-size: 14px; font-weight: 700; padding-top: 12px;">${data.time}</td>
            </tr>
          </table>
        </div>
        ${data.meetLink ? btn('Join on Google Meet', String(data.meetLink)) : btn('View My Schedule', 'https://fusion8.tech/student/live')}
        <br/><br/>
        ${p('<small style="color: #9CA3AF;">If you can\'t attend live, check your course library for the recorded session afterwards.</small>')}
      `);

    default:
      return wrap(`
        ${h1('Notification from Fusion8')}
        ${p(JSON.stringify(data))}
      `);
  }
}

/**
 * Send a transactional email via the server-side /api/email route.
 * This function is safe to call from both client and server components
 * because the actual API key never leaves the server.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error ?? 'Email delivery failed.' };
    }

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Convenience wrappers for common email events ──────────────────────────────

export const emailEvents = {
  async welcomeStudent(to: string, name: string) {
    return sendEmail({ to, template: 'welcome', data: { name, role: 'student' } });
  },

  async welcomeTeacher(to: string, name: string) {
    return sendEmail({ to, template: 'welcome', data: { name, role: 'teacher' } });
  },

  async teacherApproved(to: string, name: string, matricule?: string) {
    return sendEmail({ to, template: 'teacher_approved', data: { name, matricule: matricule ?? '' } });
  },

  async teacherRejected(to: string, name: string, reason?: string) {
    return sendEmail({ to, template: 'teacher_rejected', data: { name, reason: reason ?? '' } });
  },

  async enrollmentConfirmed(
    to: string,
    name: string,
    courseTitle: string,
    courseId: string,
    paymentReference: string
  ) {
    return sendEmail({
      to,
      template: 'enrollment_confirmed',
      data: { name, courseTitle, courseId, paymentReference },
    });
  },

  async certificateIssued(
    to: string,
    name: string,
    courseTitle: string,
    certId: string,
    downloadUrl: string,
    verificationUrl: string
  ) {
    return sendEmail({
      to,
      template: 'certificate_issued',
      data: { name, courseTitle, certId, downloadUrl, verificationUrl },
    });
  },

  async assignmentGraded(
    to: string,
    name: string,
    assignmentTitle: string,
    grade: string,
    feedback?: string
  ) {
    return sendEmail({
      to,
      template: 'assignment_graded',
      data: { name, assignmentTitle, grade, feedback: feedback ?? '' },
    });
  },
};

// Export template builder for the API route to use server-side
export { buildHtmlBody, buildSubject };
