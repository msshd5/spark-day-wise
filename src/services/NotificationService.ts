import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface ReminderOptions {
  id: number;
  title: string;
  body: string;
  scheduledAt: Date;
  data?: Record<string, unknown>;
}

class NotificationService {
  private initialized = false;

  async initialize() {
    if (this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // طلب إذن الإشعارات المحلية
      const localPermission = await LocalNotifications.requestPermissions();
      console.log('Local notifications permission:', localPermission);

      // طلب إذن إشعارات Push
      const pushPermission = await PushNotifications.requestPermissions();
      console.log('Push notifications permission:', pushPermission);

      if (pushPermission.receive === 'granted') {
        await PushNotifications.register();

        // مستمعي الأحداث
        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success:', token.value);
          // يمكن حفظ الـ token في قاعدة البيانات للإشعارات من الخادم
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received:', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Push action:', action);
        });
      }

      // مستمعي الإشعارات المحلية
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Local notification received:', notification);
      });

      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        console.log('Local notification action:', action);
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  async scheduleReminder(options: ReminderOptions) {
    if (!Capacitor.isNativePlatform()) {
      console.log('Notifications not available on web');
      // في الويب، نستخدم Web Notifications إذا كانت متاحة
      if ('Notification' in window && Notification.permission === 'granted') {
        const timeDiff = options.scheduledAt.getTime() - Date.now();
        if (timeDiff > 0) {
          setTimeout(() => {
            new Notification(options.title, { body: options.body });
          }, timeDiff);
        }
      }
      return;
    }

    try {
      const scheduleOptions: ScheduleOptions = {
        notifications: [
          {
            id: options.id,
            title: options.title,
            body: options.body,
            schedule: { at: options.scheduledAt },
            sound: 'default',
            extra: options.data,
          },
        ],
      };

      await LocalNotifications.schedule(scheduleOptions);
      console.log('Reminder scheduled:', options);
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
    }
  }

  async scheduleTaskReminder(taskId: string, taskTitle: string, dueDate: Date) {
    // تذكير قبل 30 دقيقة
    const reminderTime = new Date(dueDate.getTime() - 30 * 60 * 1000);
    
    if (reminderTime > new Date()) {
      await this.scheduleReminder({
        id: this.generateNotificationId(taskId),
        title: '⏰ تذكير بمهمة',
        body: `موعد "${taskTitle}" بعد 30 دقيقة`,
        scheduledAt: reminderTime,
        data: { taskId, type: 'task_reminder' },
      });
    }
  }

  async scheduleDailyReviewReminder(hour: number = 21, minute: number = 0) {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hour, minute, 0, 0);

    // إذا فات الوقت اليوم، نجدوله للغد
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    await this.scheduleReminder({
      id: 999, // ID ثابت للمراجعة اليومية
      title: '📝 وقت المراجعة اليومية',
      body: 'خذ دقيقة لمراجعة إنجازاتك وتحديد مهام الغد',
      scheduledAt: reminderTime,
      data: { type: 'daily_review' },
    });
  }

  async scheduleMorningPlanReminder(hour: number = 8, minute: number = 0) {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hour, minute, 0, 0);

    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    await this.scheduleReminder({
      id: 998, // ID ثابت للتخطيط الصباحي
      title: '🌅 صباح الخير!',
      body: 'جاهز لترتيب يومك؟ افتح التطبيق وحدد أولوياتك',
      scheduledAt: reminderTime,
      data: { type: 'morning_plan' },
    });
  }

  async cancelReminder(notificationId: number) {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    } catch (error) {
      console.error('Failed to cancel reminder:', error);
    }
  }

  async cancelTaskReminder(taskId: string) {
    await this.cancelReminder(this.generateNotificationId(taskId));
  }

  async getPendingReminders() {
    if (!Capacitor.isNativePlatform()) return [];

    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications;
    } catch (error) {
      console.error('Failed to get pending reminders:', error);
      return [];
    }
  }

  private generateNotificationId(taskId: string): number {
    // تحويل UUID لرقم (أول 8 أحرف)
    return parseInt(taskId.replace(/-/g, '').slice(0, 8), 16) % 1000000;
  }
}

export const notificationService = new NotificationService();
