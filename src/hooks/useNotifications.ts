import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { notificationService } from '@/services/NotificationService';

export function useNotifications() {
  useEffect(() => {
    // تهيئة الإشعارات عند بدء التطبيق
    notificationService.initialize();

    // جدولة التذكيرات اليومية
    if (Capacitor.isNativePlatform()) {
      notificationService.scheduleMorningPlanReminder(8, 0);
      notificationService.scheduleDailyReviewReminder(21, 0);
    }
  }, []);

  return {
    scheduleTaskReminder: notificationService.scheduleTaskReminder.bind(notificationService),
    cancelTaskReminder: notificationService.cancelTaskReminder.bind(notificationService),
    scheduleReminder: notificationService.scheduleReminder.bind(notificationService),
    cancelReminder: notificationService.cancelReminder.bind(notificationService),
    getPendingReminders: notificationService.getPendingReminders.bind(notificationService),
  };
}
