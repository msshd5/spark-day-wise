import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Commitment, DailyPlan } from '@/types/database';
import { format } from 'date-fns';

export interface UserContext {
  profile: {
    name: string | null;
    workDays: string[];
    workStartTime: string | null;
    workEndTime: string | null;
  };
  tasks: {
    total: number;
    pending: number;
    urgent: number;
    todayDue: number;
    items: Task[];
  };
  commitments: Commitment[];
  todayPlan: DailyPlan | null;
}

export function useUserContext() {
  const { user, profile } = useAuth();
  const [context, setContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContext = useCallback(async () => {
    if (!user) {
      setContext(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // جلب البيانات بالتوازي
      const [tasksResult, commitmentsResult, planResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'completed')
          .order('priority', { ascending: false })
          .limit(50),
        supabase
          .from('commitments')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('daily_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_date', today)
          .maybeSingle(),
      ]);

      const tasks = (tasksResult.data || []) as Task[];
      const commitments = (commitmentsResult.data || []) as Commitment[];

      setContext({
        profile: {
          name: profile?.name || null,
          workDays: profile?.work_days || ['sun', 'mon', 'tue', 'wed', 'thu'],
          workStartTime: profile?.work_start_time || '08:00',
          workEndTime: profile?.work_end_time || '15:00',
        },
        tasks: {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending').length,
          urgent: tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length,
          todayDue: tasks.filter(t => t.due_date === today).length,
          items: tasks,
        },
        commitments,
        todayPlan: planResult.data ? {
          ...planResult.data,
          top_priorities: (planResult.data.top_priorities as string[]) || [],
          scheduled_tasks: (planResult.data.scheduled_tasks as any[]) || [],
          energy_level: planResult.data.energy_level as 'low' | 'medium' | 'high',
        } : null,
      });
    } catch (error) {
      console.error('Error fetching user context:', error);
    }

    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // تحويل السياق لنص للـ AI
  const getContextSummary = useCallback((): string => {
    if (!context) return '';

    const { profile, tasks, commitments, todayPlan } = context;
    const todayName = format(new Date(), 'EEEE', { locale: undefined });

    let summary = '';

    // معلومات المستخدم
    if (profile.name) {
      summary += `اسم المستخدم: ${profile.name}\n`;
    }

    // أوقات الدوام
    if (profile.workStartTime && profile.workEndTime) {
      summary += `أوقات الدوام: من ${profile.workStartTime} إلى ${profile.workEndTime}\n`;
      summary += `أيام الدوام: ${profile.workDays.join(', ')}\n`;
    }

    // ملخص المهام
    summary += `\n--- المهام ---\n`;
    summary += `إجمالي المهام: ${tasks.total}\n`;
    summary += `المهام المعلقة: ${tasks.pending}\n`;
    summary += `المهام العاجلة: ${tasks.urgent}\n`;
    summary += `مهام اليوم: ${tasks.todayDue}\n`;

    if (tasks.items.length > 0) {
      summary += `\nأهم المهام:\n`;
      tasks.items.slice(0, 5).forEach((task, i) => {
        summary += `${i + 1}. ${task.title} (${task.priority}) - ${task.category}\n`;
      });
    }

    // الالتزامات
    if (commitments.length > 0) {
      summary += `\n--- الالتزامات ---\n`;
      commitments.forEach(c => {
        summary += `- ${c.title}: ${c.start_time}-${c.end_time} (${c.days.join(', ')})\n`;
      });
    }

    // خطة اليوم
    if (todayPlan) {
      summary += `\n--- خطة اليوم ---\n`;
      if (todayPlan.top_priorities.length > 0) {
        summary += `الأولويات: ${todayPlan.top_priorities.join(', ')}\n`;
      }
      summary += `مستوى الطاقة: ${todayPlan.energy_level}\n`;
    }

    return summary;
  }, [context]);

  return {
    context,
    loading,
    refetch: fetchContext,
    getContextSummary,
  };
}
