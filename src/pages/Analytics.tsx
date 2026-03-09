import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, TrendingUp, Wallet, Target, Heart,
  BookOpen, GraduationCap, Loader2, Brain,
  CheckCircle2, Clock, Flame,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  Legend, Area, AreaChart,
} from 'recharts';
import { format, startOfMonth, subMonths, startOfWeek, subWeeks } from 'date-fns';
import { ar } from 'date-fns/locale';

const CHART_COLORS = [
  'hsl(265, 89%, 66%)', 'hsl(200, 95%, 60%)', 'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(330, 81%, 60%)',
  'hsl(25, 95%, 53%)', 'hsl(240, 5%, 60%)',
];

const categoryLabels: Record<string, string> = {
  food: 'طعام', transport: 'مواصلات', shopping: 'تسوق', bills: 'فواتير',
  entertainment: 'ترفيه', health: 'صحة', education: 'تعليم', rent: 'إيجار',
  subscriptions: 'اشتراكات', other: 'أخرى', work: 'عمل', personal: 'شخصي',
  learning: 'تعلم',
};

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financeData, setFinanceData] = useState<any>(null);
  const [taskData, setTaskData] = useState<any>(null);
  const [goalData, setGoalData] = useState<any>(null);
  const [habitData, setHabitData] = useState<any>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [readingData, setReadingData] = useState<any>(null);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchFinanceData(),
      fetchTaskData(),
      fetchGoalData(),
      fetchHabitData(),
      fetchCourseData(),
      fetchReadingData(),
    ]);
    setLoading(false);
  };

  const fetchFinanceData = async () => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { start: format(startOfMonth(d), 'yyyy-MM-dd'), label: format(d, 'MMM', { locale: ar }) };
    });

    const { data: expenses } = await supabase
      .from('expenses').select('amount, category, expense_date')
      .eq('user_id', user!.id).gte('expense_date', months[0].start);

    const { data: budget } = await supabase
      .from('budgets').select('total_budget, month')
      .eq('user_id', user!.id).gte('month', months[0].start);

    const monthlySpending = months.map(m => {
      const monthExpenses = (expenses || []).filter(e => e.expense_date.startsWith(m.start.slice(0, 7)));
      const total = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
      const b = (budget || []).find(b => b.month.startsWith(m.start.slice(0, 7)));
      return { month: m.label, مصروفات: total, ميزانية: b ? Number(b.total_budget) : 0 };
    });

    const categoryTotals: Record<string, number> = {};
    (expenses || []).filter(e => e.expense_date.startsWith(format(new Date(), 'yyyy-MM'))).forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
    });
    const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
      name: categoryLabels[name] || name, value,
    })).sort((a, b) => b.value - a.value);

    setFinanceData({ monthlySpending, pieData });
  };

  const fetchTaskData = async () => {
    const { data: tasks } = await supabase
      .from('tasks').select('status, priority, category, created_at, completed_at')
      .eq('user_id', user!.id);

    const all = tasks || [];
    const completed = all.filter(t => t.status === 'completed').length;
    const pending = all.filter(t => t.status === 'pending').length;
    const inProgress = all.filter(t => t.status === 'in_progress').length;

    const byPriority = [
      { name: 'عاجل', value: all.filter(t => t.priority === 'urgent').length },
      { name: 'عالي', value: all.filter(t => t.priority === 'high').length },
      { name: 'متوسط', value: all.filter(t => t.priority === 'medium').length },
      { name: 'منخفض', value: all.filter(t => t.priority === 'low').length },
    ].filter(p => p.value > 0);

    const byCategory: Record<string, number> = {};
    all.forEach(t => { if (t.category) byCategory[t.category] = (byCategory[t.category] || 0) + 1; });
    const categoryChart = Object.entries(byCategory).map(([name, count]) => ({
      name: categoryLabels[name] || name, عدد: count,
    }));

    // Weekly completion trend (last 8 weeks)
    const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
      const weekStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 6 }), 7 - i);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const ws = format(weekStart, 'yyyy-MM-dd');
      const we = format(weekEnd, 'yyyy-MM-dd');
      const count = all.filter(t => t.completed_at && t.completed_at >= ws && t.completed_at < we).length;
      return { week: format(weekStart, 'd/M'), مكتمل: count };
    });

    setTaskData({ completed, pending, inProgress, total: all.length, byPriority, categoryChart, weeklyTrend });
  };

  const fetchGoalData = async () => {
    const { data: goals } = await supabase
      .from('goals').select('type, is_completed, period_date')
      .eq('user_id', user!.id);

    const all = goals || [];
    const summary = ['monthly', 'weekly', 'daily'].map(type => {
      const typeGoals = all.filter(g => g.type === type);
      return {
        name: type === 'monthly' ? 'شهري' : type === 'weekly' ? 'أسبوعي' : 'يومي',
        إجمالي: typeGoals.length,
        مكتمل: typeGoals.filter(g => g.is_completed).length,
      };
    });

    setGoalData({ summary, total: all.length, completed: all.filter(g => g.is_completed).length });
  };

  const fetchHabitData = async () => {
    const { data: habits } = await supabase
      .from('habits').select('id, title, target_count, is_active')
      .eq('user_id', user!.id).eq('is_active', true);

    const { data: logs } = await supabase
      .from('habit_logs').select('habit_id, log_date, completed_count')
      .eq('user_id', user!.id)
      .gte('log_date', format(subWeeks(new Date(), 4), 'yyyy-MM-dd'));

    const habitStats = (habits || []).map(h => {
      const habitLogs = (logs || []).filter(l => l.habit_id === h.id);
      return { name: h.title, أيام: habitLogs.length, هدف: (h.target_count || 1) * 28 };
    });

    setHabitData({ habits: habitStats, totalHabits: (habits || []).length });
  };

  const fetchCourseData = async () => {
    const { data: courses } = await supabase
      .from('courses').select('title, status, completed_lessons, total_lessons')
      .eq('user_id', user!.id);

    const all = courses || [];
    const stats = all.map(c => ({
      name: c.title.length > 15 ? c.title.slice(0, 15) + '…' : c.title,
      تقدم: c.total_lessons ? Math.round(((c.completed_lessons || 0) / c.total_lessons) * 100) : 0,
    }));

    setCourseData({
      stats,
      total: all.length,
      completed: all.filter(c => c.status === 'completed').length,
      inProgress: all.filter(c => c.status === 'in_progress').length,
    });
  };

  const fetchReadingData = async () => {
    const { data: books } = await supabase
      .from('books').select('status')
      .eq('user_id', user!.id);

    const { data: sessions } = await supabase
      .from('reading_sessions').select('duration_minutes, pages_read, session_date')
      .eq('user_id', user!.id)
      .gte('session_date', format(subWeeks(new Date(), 8), 'yyyy-MM-dd'));

    const all = books || [];
    const weeklyReading = Array.from({ length: 8 }, (_, i) => {
      const weekStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 6 }), 7 - i);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const ws = format(weekStart, 'yyyy-MM-dd');
      const we = format(weekEnd, 'yyyy-MM-dd');
      const weekSessions = (sessions || []).filter(s => s.session_date >= ws && s.session_date < we);
      return {
        week: format(weekStart, 'd/M'),
        دقائق: weekSessions.reduce((s, se) => s + (se.duration_minutes || 0), 0),
        صفحات: weekSessions.reduce((s, se) => s + (se.pages_read || 0), 0),
      };
    });

    setReadingData({
      total: all.length,
      reading: all.filter(b => b.status === 'reading').length,
      completed: all.filter(b => b.status === 'completed').length,
      weeklyReading,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const completionRate = taskData?.total > 0
    ? Math.round((taskData.completed / taskData.total) * 100) : 0;
  const goalRate = goalData?.total > 0
    ? Math.round((goalData.completed / goalData.total) * 100) : 0;

  return (
    <div className="min-h-screen p-4 pb-24">
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          التحليلات والإحصائيات
        </h1>
        <p className="text-muted-foreground text-sm">نظرة شاملة على أدائك</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" />
            <p className="text-2xl font-bold text-primary">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">إنجاز المهام</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold text-accent">{goalRate}%</p>
            <p className="text-xs text-muted-foreground">تحقيق الأهداف</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-warning">{habitData?.totalHabits || 0}</p>
            <p className="text-xs text-muted-foreground">عادة نشطة</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{readingData?.reading || 0}</p>
            <p className="text-xs text-muted-foreground">كتب قيد القراءة</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="finance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-muted">
          <TabsTrigger value="finance" className="text-xs">💰 المالية</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">✅ المهام</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs">🎯 الأهداف</TabsTrigger>
          <TabsTrigger value="habits" className="text-xs">🔥 العادات</TabsTrigger>
          <TabsTrigger value="courses" className="text-xs">📚 الكورسات</TabsTrigger>
          <TabsTrigger value="reading" className="text-xs">📖 القراءة</TabsTrigger>
        </TabsList>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-4">
          {financeData?.monthlySpending && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">المصروفات vs الميزانية (6 أشهر)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={financeData.monthlySpending}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 20%)" />
                    <XAxis dataKey="month" stroke="hsl(240, 5%, 60%)" fontSize={12} />
                    <YAxis stroke="hsl(240, 5%, 60%)" fontSize={12} />
                    <Tooltip contentStyle={{ background: 'hsl(240, 15%, 12%)', border: '1px solid hsl(240, 10%, 20%)', borderRadius: '0.5rem', color: 'white' }} />
                    <Legend />
                    <Bar dataKey="ميزانية" fill="hsl(200, 95%, 60%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="مصروفات" fill="hsl(265, 89%, 66%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {financeData?.pieData?.length > 0 && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">توزيع المصروفات (الشهر الحالي)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={financeData.pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {financeData.pieData.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(240, 15%, 12%)', border: '1px solid hsl(240, 10%, 20%)', borderRadius: '0.5rem', color: 'white' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass-card"><CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-success">{taskData?.completed || 0}</p>
              <p className="text-xs text-muted-foreground">مكتمل</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-warning">{taskData?.inProgress || 0}</p>
              <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-muted-foreground">{taskData?.pending || 0}</p>
              <p className="text-xs text-muted-foreground">معلق</p>
            </CardContent></Card>
          </div>

          {taskData?.weeklyTrend && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">المهام المكتملة أسبوعياً</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={taskData.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 20%)" />
                    <XAxis dataKey="week" stroke="hsl(240, 5%, 60%)" fontSize={12} />
                    <YAxis stroke="hsl(240, 5%, 60%)" fontSize={12} />
                    <Tooltip contentStyle={{ background: 'hsl(240, 15%, 12%)', border: '1px solid hsl(240, 10%, 20%)', borderRadius: '0.5rem', color: 'white' }} />
                    <Area type="monotone" dataKey="مكتمل" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%, 0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {taskData?.byPriority?.length > 0 && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">توزيع حسب الأولوية</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={taskData.byPriority} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {taskData.byPriority.map((_: any, i: number) => (
                        <Cell key={i} fill={['hsl(0, 72%, 51%)', 'hsl(25, 95%, 53%)', 'hsl(38, 92%, 50%)', 'hsl(142, 71%, 45%)'][i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(240, 15%, 12%)', border: '1px solid hsl(240, 10%, 20%)', borderRadius: '0.5rem', color: 'white' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          {goalData?.summary && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">تحقيق الأهداف</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={goalData.summary}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 20%)" />
                    <XAxis dataKey="name" stroke="hsl(240, 5%, 60%)" fontSize={12} />
                    <YAxis stroke="hsl(240, 5%, 60%)" fontSize={12} />
                    <Tooltip contentStyle={{ background: 'hsl(240, 15%, 12%)', border: '1px solid hsl(240, 10%, 20%)', borderRadius: '0.5rem', color: 'white' }} />
                    <Legend />
                    <Bar dataKey="إجمالي" fill="hsl(240, 10%, 30%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="مكتمل" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Habits Tab */}
        <TabsContent value="habits" className="space-y-4">
          {habitData?.habits?.length > 0 ? (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">التزام العادات (4 أسابيع)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={habitData.habits} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 20%)" />
                    <XAxis type="number" stroke="hsl(240, 5%, 60%)" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(240, 5%, 60%)" fontSize={11} width={80} />
                    <Tooltip contentStyle={{ background: 'hsl(240, 15%, 12%)', border: '1px solid hsl(240, 10%, 20%)', borderRadius: '0.5rem', color: 'white' }} />
                    <Bar dataKey="أيام" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Flame className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد عادات نشطة بعد</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass-card"><CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-primary">{courseData?.total || 0}</p>
              <p className="text-xs text-muted-foreground">إجمالي</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-warning">{courseData?.inProgress || 0}</p>
              <p className="text-xs text-muted-foreground">قيد الدراسة</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-success">{courseData?.completed || 0}</p>
              <p className="text-xs text-muted-foreground">مكتمل</p>
            </CardContent></Card>
          </div>
          {courseData?.stats?.length > 0 && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">تقدم الكورسات</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {courseData.stats.map((c: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{c.name}</span>
                      <span className="text-primary font-bold">{c.تقدم}%</span>
                    </div>
                    <Progress value={c.تقدم} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reading Tab */}
        <TabsContent value="reading" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass-card"><CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{readingData?.total || 0}</p>
              <p className="text-xs text-muted-foreground">كتب</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-accent">{readingData?.reading || 0}</p>
              <p className="text-xs text-muted-foreground">قيد القراءة</p>
            </CardContent></Card>
            <Card className="glass-card"><CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-success">{readingData?.completed || 0}</p>
              <p className="text-xs text-muted-foreground">مكتمل</p>
            </CardContent></Card>
          </div>
          {readingData?.weeklyReading && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">القراءة الأسبوعية</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={readingData.weeklyReading}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 20%)" />
                    <XAxis dataKey="week" stroke="hsl(240, 5%, 60%)" fontSize={12} />
                    <YAxis stroke="hsl(240, 5%, 60%)" fontSize={12} />
                    <Tooltip contentStyle={{ background: 'hsl(240, 15%, 12%)', border: '1px solid hsl(240, 10%, 20%)', borderRadius: '0.5rem', color: 'white' }} />
                    <Legend />
                    <Line type="monotone" dataKey="دقائق" stroke="hsl(265, 89%, 66%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="صفحات" stroke="hsl(200, 95%, 60%)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
