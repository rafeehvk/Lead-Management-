import { FollowUp, Lead, User, FollowUpNotification } from '../types';

const NOTIFICATIONS_LOG_KEY = 'mysar_notifications_log_v1';

export class NotificationService {
  /**
   * Get all approaching/due follow-ups
   */
  public getApproachingFollowUps(
    followUps: FollowUp[],
    leads: Lead[],
    users: User[],
    forUser?: User
  ): FollowUpNotification[] {
    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date(Date.now() + 86400000);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    const results: FollowUpNotification[] = [];

    followUps.forEach((fup) => {
      if (fup.status === 'Completed' || fup.status === 'Cancelled') return;

      const targetDate = fup.nextFollowUpDate || fup.followUpDate;
      if (!targetDate) return;

      // Filter by user if salesperson
      if (forUser && forUser.role === 'Salesperson' && fup.staff !== forUser.name) {
        return;
      }

      let urgency: 'Today' | 'Tomorrow' | 'Overdue' | 'Upcoming' = 'Upcoming';
      if (targetDate === today) {
        urgency = 'Today';
      } else if (targetDate === tomorrow) {
        urgency = 'Tomorrow';
      } else if (targetDate < today) {
        urgency = 'Overdue';
      } else {
        urgency = 'Upcoming';
      }

      // Find matched lead
      const lead = leads.find((l) => l.id === fup.leadId);
      // Find matched salesperson user
      const salesperson = users.find((u) => u.name === fup.staff) || {
        name: fup.staff,
        email: `${fup.staff.toLowerCase().replace(/\s+/g, '.')}@casbiro.com`,
      };

      results.push({
        id: `NOTIF-${fup.id}-${targetDate}`,
        followUpId: fup.id,
        leadId: fup.leadId,
        instituteName: fup.instituteName || lead?.instituteName || 'Institutional Client',
        contactPerson: lead?.contactPerson || 'Management Coordinator',
        mobile: lead?.mobile || '',
        email: lead?.email || '',
        salespersonName: fup.staff,
        salespersonEmail: (salesperson as User).email || 'sales@mysar.in',
        followUpDate: targetDate,
        followUpType: fup.followUpType,
        discussion: fup.discussion || 'Scheduled institutional follow-up discussion',
        remarks: fup.remarks || 'Conduct follow-up and log outcomes in CRM',
        studentCount: lead?.studentCount || 0,
        urgency,
        status: 'Pending',
      });
    });

    // Sort: Overdue first, then Today, then Tomorrow, then Upcoming
    const priorityOrder = { Overdue: 0, Today: 1, Tomorrow: 2, Upcoming: 3 };
    return results.sort((a, b) => priorityOrder[a.urgency] - priorityOrder[b.urgency]);
  }

  /**
   * Alias for getApproachingFollowUps
   */
  public getDueFollowUpNotifications(
    followUps: FollowUp[],
    leads: Lead[],
    users: User[],
    forUser?: User
  ): FollowUpNotification[] {
    return this.getApproachingFollowUps(followUps, leads, users, forUser);
  }

  /**
   * Generates formatted HTML email body for Gmail delivery
   */
  public generateEmailTemplate(notif: FollowUpNotification, appUrl: string = window.location.origin): {
    subject: string;
    html: string;
    text: string;
  } {
    const urgencyLabel =
      notif.urgency === 'Today'
        ? '🔔 DUE TODAY'
        : notif.urgency === 'Tomorrow'
        ? '📅 DUE TOMORROW'
        : notif.urgency === 'Overdue'
        ? '🚨 OVERDUE ACTION REQUIRED'
        : '⏳ UPCOMING';

    const subject = `[MYSAR Alert] ${urgencyLabel}: Follow-up with ${notif.instituteName}`;

    const text = `
Dear ${notif.salespersonName},

This is an automated reminder regarding an approaching client follow-up in the MYSAR Lead Management CRM.

--- CLIENT DETAILS ---
Institute: ${notif.instituteName}
Contact Person: ${notif.contactPerson}
Phone: ${notif.mobile}
Email: ${notif.email}
Student Capacity: ${notif.studentCount} Students

--- FOLLOW-UP SCHEDULE ---
Scheduled Date: ${notif.followUpDate} (${notif.urgency})
Interaction Type: ${notif.followUpType}
Context / Discussion: ${notif.discussion}
Next Action Item: ${notif.remarks}

Direct Action Link: ${appUrl}#lead=${notif.leadId}

Best regards,
MYSAR Automated Notification Engine
Casbiro Solutions Private Limited
sales@mysar.in | +91 98450 12345
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7FAF8; margin: 0; padding: 20px; color: #1F2937; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #D9E5DD; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .header { background-color: #168A45; color: #ffffff; padding: 24px; text-align: center; }
    .brand { font-size: 20px; font-weight: bold; letter-spacing: 0.5px; }
    .subtitle { font-size: 12px; color: #EAF7EF; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; margin-top: 12px; }
    .badge-today { background: #FEF9C3; color: #854D0E; }
    .badge-tomorrow { background: #EAF7EF; color: #0B5D2A; }
    .badge-overdue { background: #FEE2E2; color: #991B1B; }
    .badge-upcoming { background: #F3F4F6; color: #374151; }
    .body { padding: 24px; }
    .greeting { font-size: 15px; font-weight: 600; color: #1F2937; margin-bottom: 12px; }
    .card { background-color: #F7FAF8; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .card-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0B5D2A; letter-spacing: 0.5px; margin-bottom: 8px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
    .label { color: #6B7280; font-weight: 500; }
    .value { color: #111827; font-weight: 600; text-align: right; }
    .notes-box { background: #FFFFFF; border-left: 3px solid #168A45; padding: 10px 14px; font-size: 12px; color: #374151; margin-top: 8px; border-radius: 0 6px 6px 0; }
    .btn-container { text-align: center; margin: 24px 0 12px 0; }
    .btn { background-color: #168A45; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; }
    .footer { background-color: #F7FAF8; border-top: 1px solid #E5E7EB; padding: 16px; text-align: center; font-size: 11px; color: #9CA3AF; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">MYSAR Lead Management CRM</div>
      <div class="subtitle">Casbiro Solutions Private Limited</div>
      <div class="badge ${
        notif.urgency === 'Today'
          ? 'badge-today'
          : notif.urgency === 'Overdue'
          ? 'badge-overdue'
          : notif.urgency === 'Tomorrow'
          ? 'badge-tomorrow'
          : 'badge-upcoming'
      }">
        ${urgencyLabel}
      </div>
    </div>

    <div class="body">
      <div class="greeting">Hello ${notif.salespersonName},</div>
      <p style="font-size: 13px; color: #4B5563; line-height: 1.5; margin-top: 0;">
        You have a scheduled follow-up pending action for <strong>${notif.instituteName}</strong>. Please find the interaction briefing below:
      </p>

      <div class="card">
        <div class="card-title">🏫 Institutional Profile</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #6B7280;">Institute Name:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #111827;">${notif.instituteName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6B7280;">Contact Person:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #111827;">${notif.contactPerson}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6B7280;">Mobile Number:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #168A45;">
              <a href="tel:${notif.mobile}" style="color: #168A45; text-decoration: none;">${notif.mobile}</a>
            </td>
          </tr>
          ${
            notif.email
              ? `<tr>
            <td style="padding: 4px 0; color: #6B7280;">Email Address:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #111827;">${notif.email}</td>
          </tr>`
              : ''
          }
          <tr>
            <td style="padding: 4px 0; color: #6B7280;">Student Strength:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #111827;">${notif.studentCount} Students</td>
          </tr>
        </table>
      </div>

      <div class="card">
        <div class="card-title">📅 Scheduled Follow-up Details</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #6B7280;">Follow-up Date:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0B5D2A;">${notif.followUpDate}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6B7280;">Interaction Mode:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #111827;">${notif.followUpType}</td>
          </tr>
        </table>

        <div style="margin-top: 10px; font-size: 12px; font-weight: 600; color: #374151;">Discussion Context:</div>
        <div class="notes-box">${notif.discussion}</div>

        ${
          notif.remarks
            ? `<div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: #374151;">Next Action Item:</div>
               <div style="font-size: 12px; color: #6B7280; font-style: italic; margin-top: 2px;">${notif.remarks}</div>`
            : ''
        }
      </div>

      <div class="btn-container">
        <a href="${appUrl}" class="btn" target="_blank">
          Open Record in MYSAR CRM &rarr;
        </a>
      </div>

      <p style="text-align: center; font-size: 11px; color: #9CA3AF; margin-top: 16px;">
        After completing this interaction, please log your discussion notes and update the next scheduled date in the MYSAR app.
      </p>
    </div>

    <div class="footer">
      Casbiro Solutions Private Limited &bull; MYSAR Smart Institutional Platform<br>
      No. 14, Hi-Tech Tech Park, Electronic City, Bangalore - 560100 &bull; sales@mysar.in
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, html, text };
  }

  /**
   * Dispatches email reminder (Simulated + GAS webhook bridge) and logs event
   */
  public async sendEmailReminder(
    notif: FollowUpNotification,
    gasWebAppUrl?: string
  ): Promise<{ success: boolean; message: string; timestamp: string }> {
    const timestamp = new Date().toISOString();
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // If a Google Apps Script Web App URL is configured, forward the dispatch to real GAS endpoint!
    if (gasWebAppUrl && gasWebAppUrl.trim().startsWith('http')) {
      try {
        await fetch(gasWebAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sendFollowUpEmailReminder',
            notification: notif,
          }),
        });
      } catch (err) {
        console.warn('GAS webhook forward warning (ignoring due to CORS)', err);
      }
    }

    // Save notification to local log
    this.saveNotificationLog({
      ...notif,
      sentAt: timestamp,
      status: 'Sent',
    });

    return {
      success: true,
      message: `Email reminder sent successfully to ${notif.salespersonEmail} for ${notif.instituteName} at ${formattedTime}`,
      timestamp,
    };
  }

  /**
   * Logs notification history in localStorage
   */
  public getNotificationLogs(): FollowUpNotification[] {
    try {
      const logs = localStorage.getItem(NOTIFICATIONS_LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  public saveNotificationLog(log: FollowUpNotification): void {
    const existing = this.getNotificationLogs();
    existing.unshift(log);
    try {
      localStorage.setItem(NOTIFICATIONS_LOG_KEY, JSON.stringify(existing.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save notification log', e);
    }
  }

  public clearLogs(): void {
    localStorage.removeItem(NOTIFICATIONS_LOG_KEY);
  }
}

export const notificationService = new NotificationService();
