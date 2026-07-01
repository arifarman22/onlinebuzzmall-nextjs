import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

interface NotifyParams {
  userId: number;
  templateName: string;
  variables?: Record<string, string>;
  title?: string;
  link?: string; // navigation link stored in type field as "system|/path"
}

export function sendNotification({ userId, templateName, variables = {}, title, link }: NotifyParams) {
  // Fire and forget — never block the API response
  _sendNotificationAsync({ userId, templateName, variables, title, link }).catch(err =>
    console.error('sendNotification error:', err)
  );
}

async function _sendNotificationAsync({ userId, templateName, variables = {}, title, link }: NotifyParams) {
    const template = await db.notificationTemplate.findFirst({ where: { name: templateName } });
    if (!template) return;

    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, firstname: true, username: true } });
    if (!user) return;

    // Replace variables in template
    const replaceVars = (text: string) => {
      let result = text;
      result = result.replace(/{{username}}/g, user.username || '');
      result = result.replace(/{{name}}/g, user.firstname || user.username || '');
      result = result.replace(/{{email}}/g, user.email || '');
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      return result;
    };

    const notifTitle = title || replaceVars(template.subject || templateName);

    // Build clean plain text message
    let messageText = replaceVars(template.email_body || template.subject || '');
    // Decode HTML entities first
    messageText = messageText
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    // Strip HTML tags
    messageText = messageText.replace(/<[^>]*>/g, '');
    // Remove any unresolved {{variables}}
    messageText = messageText.replace(/\{\{[^}]+\}\}/g, '').replace(/\s+/g, ' ').trim().substring(0, 500);

    // Log notification in database
    await db.notificationLog.create({
      data: {
        user_id: userId,
        title: notifTitle,
        message: messageText,
        type: link ? `system|${link}` : 'system',
        is_read: 0,
      },
    });

    // Send email if enabled
    if (template.email_status === 1 && user.email) {
      const subject = replaceVars(template.subject || templateName);
      const rawBody = replaceVars(template.email_body || `<p>${template.subject}</p>`);
      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px;">
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #4f46e5; margin: 0 0 16px 0; font-size: 18px;">OnlineBuzz Mall</h2>
            <p style="color: #374151; margin: 0 0 8px 0;">Hi ${user.firstname || user.username},</p>
            <div style="color: #4b5563; line-height: 1.6;">${rawBody}</div>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">© OnlineBuzz Mall. Do not reply to this email.</p>
        </div>
      `;
      await sendEmail(user.email, subject, body).catch(err => console.error('Notification email failed:', err));
    }
}

export async function sendAdminNotification({ title, message, type = 'system' }: { title: string; message: string; type?: string }) {
  try {
    // Log for admin (user_id = 0 means admin)
    await db.notificationLog.create({
      data: { user_id: 0, title, message, type, is_read: 0 },
    });
  } catch (err) {
    console.error('sendAdminNotification error:', err);
  }
}

export async function getUserNotifications(userId: number, limit = 20) {
  return db.notificationLog.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

export async function getAdminNotifications(limit = 20) {
  return db.notificationLog.findMany({
    where: { user_id: 0 },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

export async function markAsRead(id: number) {
  await db.notificationLog.update({ where: { id }, data: { is_read: 1, read_at: new Date() } });
}

export async function markAllAsRead(userId: number) {
  await db.notificationLog.updateMany({ where: { user_id: userId, is_read: 0 }, data: { is_read: 1, read_at: new Date() } });
}
