import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Commitment, DailyPlan } from '@/types/database';
import { format, startOfMonth, startOfWeek } from 'date-fns';

interface FinancialData {
  budget: number | null;
  totalExpenses: number;
  totalRecurring: number;
  remaining: number;
  expensesByCategory: { category: string; total: number }[];
  wishlistCount: number;
  wishlistTotal: number;
}

interface GoalSummary {
  monthly: { total: number; completed: number };
  weekly: { total: number; completed: number };
  daily: { total: number; completed: number };
}

interface MedicationSummary {
  active: { title: string; dosage: string | null; frequency: string; times: string[] }[];
  todayTaken: number;
  todayTotal: number;
}

interface CourseSummary {
  inProgress: { title: string; platform: string | null; completedLessons: number; totalLessons: number }[];
  completed: number;
}

interface JournalSummary {
  recentMood: string | null;
  totalEntries: number;
  lastEntryDate: string | null;
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
  goals: GoalSummary | null;
  medications: MedicationSummary | null;
  courses: CourseSummary | null;
  journal: JournalSummary | null;
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
      const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 6 }), 'yyyy-MM-dd');

      const [
        tasksResult, commitmentsResult, planResult,
        budgetResult, expensesResult, recurringResult, wishlistResult,
        goalsMonthlyResult, goalsWeeklyResult, goalsDailyResult,
        medicationsResult, medLogsResult,
        coursesResult,
        journalResult,
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'completed').order('priority', { ascending: false }).limit(50),
        supabase.from('commitments').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('daily_plans').select('*').eq('user_id', user.id).eq('plan_date', today).maybeSingle(),
        supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', currentMonth).maybeSingle(),
        supabase.from('expenses').select('*').eq('user_id', user.id).gte('expense_date', currentMonth),
        supabase.from('recurring_expenses').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('wishlist').select('*').eq('user_id', user.id).eq('is_purchased', false),
        // Goals
        supabase.from('goals').select('id, is_completed').eq('user_id', user.id).eq('type', 'monthly').eq('period_date', currentMonth),
        supabase.from('goals').select('id, is_completed').eq('user_id', user.id).eq('type', 'weekly').eq('period_date', currentWeekStart),
        supabase.from('goals').select('id, is_completed').eq('user_id', user.id).eq('type', 'daily').eq('period_date', today),
        // Medications
        supabase.from('medications').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('medication_logs').select('id').eq('user_id', user.id).eq('log_date', today),
        // Courses
        supabase.from('courses').select('*').eq('user_id', user.id),
        // Journal
        supabase.from('journal_entries').select('mood, entry_date').eq('user_id', user.id).order('entry_date', { ascending: false }).limit(5),
      ]);

      const tasks = (tasksResult.data || []) as Task[];
      const commitments = (commitmentsResult.data || []) as Commitment[];
      const expenses = expensesResult.data || [];
      const recurring = recurringResult.data || [];
      const wishlist = wishlistResult.data || [];

      // Financial
      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      const totalRecurring = recurring.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      const budgetAmount = budgetResult.data ? Number(budgetResult.data.total_budget) : null;

      const categoryTotals: Record<string, number> = {};
      expenses.forEach((e: any) => { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount); });
      recurring.forEach((e: any) => { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount); });
      const expensesByCategory = Object.entries(categoryTotals).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);

      // Goals
      const monthlyGoals = goalsMonthlyResult.data || [];
      const weeklyGoals = goalsWeeklyResult.data || [];
      const dailyGoals = goalsDailyResult.data || [];

      // Medications
      const activeMeds = medicationsResult.data || [];
      const todayLogs = medLogsResult.data || [];
      const totalMedTimes = activeMeds.reduce((sum: number, m: any) => sum + (m.times?.length || 1), 0);

      // Courses
      const allCourses = coursesResult.data || [];
      const inProgressCourses = allCourses.filter((c: any) => c.status === 'in_progress');
      const completedCourses = allCourses.filter((c: any) => c.status === 'completed').length;

      // Journal
      const journalEntries = journalResult.data || [];

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
        goals: {
          monthly: { total: monthlyGoals.length, completed: monthlyGoals.filter((g: any) => g.is_completed).length },
          weekly: { total: weeklyGoals.length, completed: weeklyGoals.filter((g: any) => g.is_completed).length },
          daily: { total: dailyGoals.length, completed: dailyGoals.filter((g: any) => g.is_completed).length },
        },
        medications: {
          active: activeMeds.map((m: any) => ({ title: m.title, dosage: m.dosage, frequency: m.frequency, times: m.times || [] })),
          todayTaken: todayLogs.length,
          todayTotal: totalMedTimes,
        },
        courses: {
          inProgress: inProgressCourses.map((c: any) => ({
            title: c.title,
            platform: c.platform,
            completedLessons: c.completed_lessons || 0,
            totalLessons: c.total_lessons || 0,
          })),
          completed: completedCourses,
        },
        journal: {
          recentMood: journalEntries[0]?.mood || null,
          totalEntries: journalEntries.length,
          lastEntryDate: journalEntries[0]?.entry_date || null,
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

  const getContextSummary = useCallback((): string => {
    if (!context) return '';

    const { profile, tasks, commitments, todayPlan, financial, goals, medications, courses, journal } = context;

    let summary = '';

    if (profile.name) summary += `اسم المستخدم: ${profile.name}\n`;
    if (profile.workStartTime && profile.workEndTime) {
      summary += `أوقات الدوام: من ${profile.workStartTime} إلى ${profile.workEndTime}\n`;
      summary += `أيام الدوام: ${profile.workDays.join(', ')}\n`;
    }

    // Tasks
    summary += `\n--- المهام ---\n`;
    summary += `إجمالي: ${tasks.total} | معلقة: ${tasks.pending} | عاجلة: ${tasks.urgent} | اليوم: ${tasks.todayDue}\n`;
    if (tasks.items.length > 0) {
      summary += `أهم المهام:\n`;
      tasks.items.slice(0, 5).forEach((task, i) => {
        summary += `${i + 1}. ${task.title} (${task.priority}) - ${task.category}\n`;
      });
    }

    // Commitments
    if (commitments.length > 0) {
      summary += `\n--- الالتزامات ---\n`;
      commitments.forEach(c => {
        summary += `- ${c.title}: ${c.start_time}-${c.end_time} (${c.days.join(', ')})\n`;
      });
    }

    // Today plan
    if (todayPlan) {
      summary += `\n--- خطة اليوم ---\n`;
      if (todayPlan.top_priorities.length > 0) summary += `الأولويات: ${todayPlan.top_priorities.join(', ')}\n`;
      summary += `مستوى الطاقة: ${todayPlan.energy_level}\n`;
    }

    // Goals
    if (goals) {
      summary += `\n--- الأهداف ---\n`;
      summary += `الشهرية: ${goals.monthly.completed}/${goals.monthly.total} مكتمل\n`;
      summary += `الأسبوعية: ${goals.weekly.completed}/${goals.weekly.total} مكتمل\n`;
      summary += `اليومية: ${goals.daily.completed}/${goals.daily.total} مكتمل\n`;
    }

    // Medications
    if (medications && medications.active.length > 0) {
      summary += `\n--- الأدوية ---\n`;
      summary += `تم أخذ ${medications.todayTaken} من ${medications.todayTotal} جرعة اليوم\n`;
      medications.active.forEach(m => {
        summary += `- ${m.title}${m.dosage ? ` (${m.dosage})` : ''} - ${m.frequency}\n`;
      });
    }

    // Courses
    if (courses) {
      summary += `\n--- الكورسات ---\n`;
      summary += `قيد الدراسة: ${courses.inProgress.length} | مكتملة: ${courses.completed}\n`;
      courses.inProgress.forEach(c => {
        const progress = c.totalLessons > 0 ? Math.round((c.completedLessons / c.totalLessons) * 100) : 0;
        summary += `- ${c.title}${c.platform ? ` (${c.platform})` : ''}: ${progress}%\n`;
      });
    }

    // Journal
    if (journal && journal.totalEntries > 0) {
      summary += `\n--- اليوميات ---\n`;
      if (journal.recentMood) summary += `المزاج الأخير: ${journal.recentMood}\n`;
      if (journal.lastEntryDate) summary += `آخر تدوينة: ${journal.lastEntryDate}\n`;
    }

    // Financial
    if (financial) {
      summary += `\n--- الوضع المالي ---\n`;
      if (financial.budget) {
        summary += `الميزانية: ${financial.budget.toLocaleString()} ر.س | المصروفات: ${financial.totalExpenses.toLocaleString()} ر.س | المتكررة: ${financial.totalRecurring.toLocaleString()} ر.س | المتبقي: ${financial.remaining.toLocaleString()} ر.س\n`;
        const pct = ((financial.totalExpenses + financial.totalRecurring) / financial.budget * 100).toFixed(1);
        summary += `نسبة الإنفاق: ${pct}%\n`;
      }
      if (financial.expensesByCategory.length > 0) {
        summary += `توزيع المصروفات: `;
        summary += financial.expensesByCategory.slice(0, 5).map(cat => `${cat.category}: ${cat.total.toLocaleString()}`).join(' | ') + '\n';
      }
      if (financial.wishlistCount > 0) {
        summary += `قائمة الأمنيات: ${financial.wishlistCount} عنصر (${financial.wishlistTotal.toLocaleString()} ر.س)\n`;
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
