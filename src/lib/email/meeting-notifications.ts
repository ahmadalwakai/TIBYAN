import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { MeetingPrivacy, UserNotificationType, MeetingType } from "@prisma/client";

interface MeetingInfo {
  id: string;
  title: string;
  description: string | null;
  meetingType: MeetingType;
  scheduledFor: Date | null;
  privacy: MeetingPrivacy;
  hostId: string;
  hostName: string;
}

/**
 * Send meeting invitation emails to specified users
 */
export async function sendMeetingInvitationEmails(
  meeting: MeetingInfo,
  invitedUserIds: string[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // Get invited users' emails
  const users = await db.user.findMany({
    where: { id: { in: invitedUserIds } },
    select: { id: true, email: true, name: true },
  });

  for (const user of users) {
    try {
      const meetingTypeText = meeting.meetingType === "VIDEO" ? "فيديو" : "صوتي";
      const scheduledText = meeting.scheduledFor
        ? `الموعد: ${new Date(meeting.scheduledFor).toLocaleString("ar-EG")}`
        : "يبدأ الآن";

      const emailHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 20px; }
            .info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .info-item { padding: 8px 0; border-bottom: 1px solid #eee; }
            .info-item:last-child { border-bottom: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎥 دعوة لاجتماع جديد</h1>
            </div>
            <div class="content">
              <p>مرحباً ${user.name || ""},</p>
              <p>تمت دعوتك للانضمام إلى اجتماع جديد في غرفة المعلمين:</p>
              
              <div class="info">
                <div class="info-item"><strong>العنوان:</strong> ${meeting.title}</div>
                <div class="info-item"><strong>النوع:</strong> اجتماع ${meetingTypeText}</div>
                <div class="info-item"><strong>${scheduledText}</strong></div>
                <div class="info-item"><strong>المضيف:</strong> ${meeting.hostName}</div>
                ${meeting.description ? `<div class="info-item"><strong>الوصف:</strong> ${meeting.description}</div>` : ""}
              </div>
              
              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/teacher-room/meeting/${meeting.id}" class="btn">
                  انضم للاجتماع
                </a>
              </center>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                هذه الدعوة من منصة تبيان التعليمية
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: user.email,
        subject: `دعوة لاجتماع: ${meeting.title}`,
        html: emailHtml,
      });

      // Update invitation record
      await db.meetingInvitation.updateMany({
        where: {
          meetingId: meeting.id,
          userId: user.id,
        },
        data: { emailSent: true },
      });

      sent++;
    } catch (error) {
      console.error(`Failed to send invitation email to ${user.email}:`, error);
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Send in-app notifications for meeting invitations
 */
export async function createMeetingInvitationNotifications(
  meeting: MeetingInfo,
  invitedUserIds: string[]
): Promise<number> {
  let created = 0;

  const meetingTypeText = meeting.meetingType === "VIDEO" ? "فيديو" : "صوتي";

  for (const userId of invitedUserIds) {
    try {
      await db.userNotification.create({
        data: {
          userId,
          type: UserNotificationType.MEETING_INVITATION,
          title: `دعوة لاجتماع ${meetingTypeText}`,
          message: `تمت دعوتك للانضمام إلى "${meeting.title}" من قبل ${meeting.hostName}`,
          link: `/teacher-room/meeting/${meeting.id}`,
          referenceType: "meeting",
          referenceId: meeting.id,
        },
      });

      // Update invitation record
      await db.meetingInvitation.updateMany({
        where: {
          meetingId: meeting.id,
          userId,
        },
        data: { notificationSent: true },
      });

      created++;
    } catch (error) {
      console.error(`Failed to create notification for user ${userId}:`, error);
    }
  }

  return created;
}

/**
 * Notify all teachers and admins about a new public meeting
 */
export async function notifyAllTeachersAdmins(
  meeting: MeetingInfo
): Promise<{ emailsSent: number; notificationsCreated: number }> {
  // Get all teachers and admins except the host
  const users = await db.user.findMany({
    where: {
      role: { in: ["INSTRUCTOR", "ADMIN"] },
      id: { not: meeting.hostId },
      status: "ACTIVE",
    },
    select: { id: true, email: true, name: true },
  });

  let emailsSent = 0;
  let notificationsCreated = 0;

  const meetingTypeText = meeting.meetingType === "VIDEO" ? "فيديو" : "صوتي";

  for (const user of users) {
    // Create in-app notification
    try {
      await db.userNotification.create({
        data: {
          userId: user.id,
          type: UserNotificationType.SYSTEM, // Generic notification for public meetings
          title: `اجتماع ${meetingTypeText} جديد`,
          message: `أنشأ ${meeting.hostName} اجتماعاً جديداً: "${meeting.title}"`,
          link: `/teacher-room/meeting/${meeting.id}`,
          referenceType: "meeting",
          referenceId: meeting.id,
        },
      });
      notificationsCreated++;
    } catch (error) {
      console.error(`Failed to create notification for user ${user.id}:`, error);
    }

    // Send email notification
    try {
      const scheduledText = meeting.scheduledFor
        ? `الموعد: ${new Date(meeting.scheduledFor).toLocaleString("ar-EG")}`
        : "يبدأ الآن";

      await sendEmail({
        to: user.email,
        subject: `اجتماع جديد: ${meeting.title}`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .btn { display: inline-block; background: #38a169; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📢 اجتماع جديد في غرفة المعلمين</h1>
              </div>
              <div class="content">
                <p>مرحباً ${user.name || ""},</p>
                <p>تم إنشاء اجتماع ${meetingTypeText} جديد في غرفة المعلمين:</p>
                <p><strong>${meeting.title}</strong></p>
                <p>${scheduledText}</p>
                <p>المضيف: ${meeting.hostName}</p>
                <center>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/teacher-room/meeting/${meeting.id}" class="btn">
                    انضم للاجتماع
                  </a>
                </center>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      emailsSent++;
    } catch (error) {
      console.error(`Failed to send email to ${user.email}:`, error);
    }
  }

  return { emailsSent, notificationsCreated };
}
