import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Commitment, DailyPlan } from '@/types/database';
import { format, startOfMonth } from 'date-fns';

interface FinancialData {
  budget: number | null;
  totalExpenses: number;
  totalRecurring: number;
  remaining: number;
  expensesByCategory: { category: string; total: number }[];
  wishlistCount: number;
  wishlistTotal: number;
}

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
  financial: FinancialData | null;
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
      const currentMonth = startOfMonth(new Date()).toISOString().split('T')[0];

      // جلب البيانات بالتوازي
      const [tasksResult, commitmentsResult, planResult, budgetResult, expensesResult, recurringResult, wishlistResult] = await Promise.all([
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
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', currentMonth)
          .maybeSingle(),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('expense_date', currentMonth),
        supabase
          .from('recurring_expenses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('wishlist')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_purchased', false),
      ]);

      const tasks = (tasksResult.data || []) as Task[];
      const commitments = (commitmentsResult.data || []) as Commitment[];
      const expenses = expensesResult.data || [];
      const recurring = recurringResult.data || [];
      const wishlist = wishlistResult.data || [];

      // حساب البيانات المالية
      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      const totalRecurring = recurring.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      const budgetAmount = budgetResult.data ? Number(budgetResult.data.total_budget) : null;

      // تجميع المصروفات حسب التصنيف
      const categoryTotals: Record<string, number> = {};
      expenses.forEach((e: any) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
      });
      recurring.forEach((e: any) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
      });

      const expensesByCategory = Object.entries(categoryTotals)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

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
        financial: {
          budget: budgetAmount,
          totalExpenses,
          totalRecurring,
          remaining: budgetAmount ? budgetAmount - totalExpenses - totalRecurring : 0,
          expensesByCategory,
          wishlistCount: wishlist.length,
          wishlistTotal: wishlist.reduce((sum: number, w: any) => sum + (Number(w.estimated_price) || 0), 0),
        },
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

    const { profile, tasks, commitments, todayPlan, financial } = context;

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

    // البيانات المالية
    if (financial) {
      summary += `\n--- الوضع المالي ---\n`;
      if (financial.budget) {
        summary += `الميزانية الشهرية: ${financial.budget.toLocaleString()} ر.س\n`;
        summary += `إجمالي المصروفات: ${financial.totalExpenses.toLocaleString()} ر.س\n`;
        summary += `المصروفات المتكررة: ${financial.totalRecurring.toLocaleString()} ر.س\n`;
        summary += `المتبقي: ${financial.remaining.toLocaleString()} ر.س\n`;
        const spentPercentage = ((financial.totalExpenses + financial.totalRecurring) / financial.budget * 100).toFixed(1);
        summary += `نسبة الإنفاق: ${spentPercentage}%\n`;
      }
      
      if (financial.expensesByCategory.length > 0) {
        summary += `\nتوزيع المصروفات:\n`;
        financial.expensesByCategory.slice(0, 5).forEach(cat => {
          summary += `- ${cat.category}: ${cat.total.toLocaleString()} ر.س\n`;
        });
      }

      if (financial.wishlistCount > 0) {
        summary += `\nقائمة الأمنيات: ${financial.wishlistCount} عنصر`;
        if (financial.wishlistTotal > 0) {
          summary += ` (تقريباً ${financial.wishlistTotal.toLocaleString()} ر.س)`;
        }
        summary += '\n';
      }
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
