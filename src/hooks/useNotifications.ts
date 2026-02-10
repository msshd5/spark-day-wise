import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { notificationService } from '@/services/NotificationService';

export function useNotifications() {
  useEffect(() => {
    const initNotifications = async () => {
      // تهيئة الإشعارات عند بدء التطبيق
      await notificationService.initialize();

      // جدولة التذكيرات اليومية
      if (Capacitor.isNativePlatform()) {
        // تذكير صباحي بالخطة
        await notificationService.scheduleMorningPlanReminder(8, 0);
        
        // تذكير بالمهام اليومية
        await notificationService.scheduleDailyTaskReminder(9, 30);
        
        // تذكيرات شرب الماء كل ساعتين
        await notificationService.scheduleWaterReminders();
        
        // تذكير المراجعة المسائية
        await notificationService.scheduleDailyReviewReminder(21, 0);
        
        // تذكيرات العادات اليومية
        await notificationService.scheduleHabitReminder(10, 0);
        await notificationService.scheduleHabitEveningReminder(20, 0);
      }
    };

    initNotifications();
  }, []);

  return {
    scheduleTaskReminder: notificationService.scheduleTaskReminder.bind(notificationService),
    cancelTaskReminder: notificationService.cancelTaskReminder.bind(notificationService),
    scheduleReminder: notificationService.scheduleReminder.bind(notificationService),
    cancelReminder: notificationService.cancelReminder.bind(notificationService),
    getPendingReminders: notificationService.getPendingReminders.bind(notificationService),
    scheduleWaterReminders: notificationService.scheduleWaterReminders.bind(notificationService),
    scheduleHabitReminder: notificationService.scheduleHabitReminder.bind(notificationService),
    scheduleHabitEveningReminder: notificationService.scheduleHabitEveningReminder.bind(notificationService),
  };
}
