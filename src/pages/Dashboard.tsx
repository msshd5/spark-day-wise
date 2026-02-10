import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Task, taskPriorityLabels, taskCategoryLabels } from '@/types/database';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WaterTracker } from '@/components/dashboard/WaterTracker';
import { SocialMediaPlanner } from '@/components/dashboard/SocialMediaPlanner';
import { IdeasNote } from '@/components/dashboard/IdeasNote';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus,
  ChevronLeft,
  Settings,
  Sparkles,
  Target,
  FileText,
  Heart,
  BookOpen,
  Repeat,
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateMode, setRateMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    inProgress: 0,
  });
  const [dailyStats, setDailyStats] = useState({ total: 0, completed: 0 });
  const [weeklyStats, setWeeklyStats] = useState({ total: 0, completed: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user!.id)
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (error) {
      console.error('خطأ في جلب المهام:', error);
      setLoading(false);
      return;
    }

    const tasksData = (data || []) as Task[];
    setTasks(tasksData);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // حساب الإحصائيات العامة
    const completed = tasksData.filter(t => t.status === 'completed').length;
    const overdue = tasksData.filter(t => 
      t.due_date && 
      new Date(t.due_date) < today && 
      t.status !== 'completed'
    ).length;
    const inProgress = tasksData.filter(t => t.status === 'in_progress').length;

    setStats({ total: tasksData.length, completed, overdue, inProgress });

    // إحصائيات يومية
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const todayTasks = tasksData.filter(t => t.due_date && new Date(t.due_date) >= todayStart && new Date(t.due_date) <= todayEnd);
    const todayCompleted = todayTasks.filter(t => t.status === 'completed').length;
    setDailyStats({ total: todayTasks.length, completed: todayCompleted });

    // إحصائيات أسبوعية
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 6 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 6 });
    const weekTasks = tasksData.filter(t => t.due_date && new Date(t.due_date) >= weekStart && new Date(t.due_date) <= weekEnd);
    const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;
    setWeeklyStats({ total: weekTasks.length, completed: weekCompleted });

    // إحصائيات شهرية
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const monthTasks = tasksData.filter(t => t.due_date && new Date(t.due_date) >= monthStart && new Date(t.due_date) <= monthEnd);
    const monthCompleted = monthTasks.filter(t => t.status === 'completed').length;
    setMonthlyStats({ total: monthTasks.length, completed: monthCompleted });

    setLoading(false);
  };

  const todayDate = format(new Date(), 'EEEE، d MMMM', { locale: ar });
  const greeting = getGreeting();
  const userName = profile?.name || 'صديقي';

  // أهم 3 مهام لليوم
  const topTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);

  // المهام المتأخرة
  const overdueTasks = tasks.filter(t => 
    t.due_date && 
    new Date(t.due_date) < new Date() && 
    t.status !== 'completed'
  );

  const activeStats = rateMode === 'daily' ? dailyStats : rateMode === 'weekly' ? weeklyStats : monthlyStats;
  const completionRate = activeStats.total > 0 
    ? Math.round((activeStats.completed / activeStats.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* الهيدر */}
      <header className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <p className="text-muted-foreground text-sm">{todayDate}</p>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}، {userName} 👋
          </h1>
        </div>
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </header>

      {/* بطاقة الإحصائيات - أول شيء */}
      <Card className="glass-card mb-6 overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        <CardContent className="relative p-4">
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/20">
                <Target className="w-5 h-5 text-primary" />
              </div>
                <div>
                  <Select value={rateMode} onValueChange={(v) => setRateMode(v as 'daily' | 'weekly' | 'monthly')}>
                    <SelectTrigger className="h-7 w-24 text-xs border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">معدل الإنجاز</p>
                  <p className="text-2xl font-bold">{completionRate}%</p>
                </div>
              </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-primary">{activeStats.completed}</p>
              <p className="text-xs text-muted-foreground">من {activeStats.total}</p>
            </div>
          </div>
          <Progress value={completionRate} className="h-2 bg-muted" />
          
          {/* إحصائيات صغيرة */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{stats.total - stats.completed - stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">في الانتظار</p>
            </div>
            <div className="text-center">
              <p className={cn(
                "text-lg font-bold",
                stats.overdue > 0 ? "text-destructive" : "text-foreground"
              )}>
                {stats.overdue}
              </p>
              <p className="text-xs text-muted-foreground">متأخر</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تنبيه المهام المتأخرة */}
      {overdueTasks.length > 0 && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-destructive">
                  لديك {overdueTasks.length} مهام متأخرة
                </p>
                <p className="text-sm text-muted-foreground">
                  تحتاج للانتباه الفوري
                </p>
              </div>
              <Link to="/tasks?filter=overdue">
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* الإجراءات السريعة - ثاني شيء */}
      <section className="mb-6 animate-fade-in">
        <h2 className="text-lg font-bold mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/content">
            <Card className="glass-card hover:border-blue-500/50 transition-all cursor-pointer">
              <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-blue-500/20">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm font-medium">المحتوى</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/health">
            <Card className="glass-card hover:border-pink-500/50 transition-all cursor-pointer">
              <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-pink-500/20">
                  <Heart className="w-5 h-5 text-pink-500" />
                </div>
                <p className="text-sm font-medium">الصحة</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/review">
            <Card className="glass-card hover:border-warning/50 transition-all cursor-pointer">
              <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-warning/20">
                  <CheckCircle2 className="w-5 h-5 text-warning" />
                </div>
                <p className="text-sm font-medium">المراجعة</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/reading">
            <Card className="glass-card hover:border-emerald-500/50 transition-all cursor-pointer">
              <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm font-medium">القراءة</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/habits">
            <Card className="glass-card hover:border-violet-500/50 transition-all cursor-pointer">
              <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-violet-500/20">
                  <Repeat className="w-5 h-5 text-violet-500" />
                </div>
                <p className="text-sm font-medium">العادات</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/goals">
            <Card className="glass-card hover:border-emerald-500/50 transition-all cursor-pointer">
              <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm font-medium">الأهداف</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* أولويات اليوم */}
      <section className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">أولوياتك اليوم</h2>
          </div>
          <Link to="/tasks">
            <Button variant="ghost" size="sm" className="text-primary">
              عرض الكل
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          </Link>
        </div>

        {topTasks.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">لا توجد مهام حالياً</p>
              <Link to="/tasks">
                <Button className="btn-gradient">
                  <Plus className="w-4 h-4 ml-2" />
                  أضف مهمة جديدة
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {topTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index + 1} />
            ))}
          </div>
        )}
      </section>

      {/* المواعيد القادمة */}
      <section className="mb-6">
        <UpcomingAppointments />
      </section>

      {/* شرب الماء */}
      <section className="mb-6 animate-fade-in">
        <WaterTracker />
      </section>

      {/* مذكرة الأفكار */}
      <section className="mb-6 animate-fade-in">
        <IdeasNote />
      </section>

      {/* تخطيط المحتوى */}
      <section className="mb-6 animate-fade-in">
        <SocialMediaPlanner />
      </section>

    </div>
  );
}

function TaskCard({ task, index }: { task: Task; index: number }) {
  const priorityColors = {
    urgent: 'bg-priority-urgent',
    high: 'bg-priority-high',
    medium: 'bg-priority-medium',
    low: 'bg-priority-low',
  };

  return (
    <Card className="glass-card hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white",
            priorityColors[task.priority]
          )}>
            {index}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{task.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {taskCategoryLabels[task.category]}
              </Badge>
              {task.due_date && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(task.due_date), 'h:mm a', { locale: ar })}
                </span>
              )}
            </div>
          </div>
          {task.estimated_duration && (
            <Badge variant="secondary" className="text-xs">
              {task.estimated_duration} د
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'صباح الخير';
  if (hour < 17) return 'مساء الخير';
  if (hour < 21) return 'مساء النور';
  return 'مساء الخير';
}
