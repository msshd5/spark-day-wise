import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Task, DailyPlan, taskPriorityLabels } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sun,
  Sunset,
  Moon,
  Target,
  Zap,
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isToday, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Planner() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    
    // جلب المهام غير المكتملة
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user!.id)
      .neq('status', 'completed')
      .order('priority', { ascending: false });

    setTasks((tasksData || []) as Task[]);

    // جلب الخطة اليومية
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data: planData } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', user!.id)
      .eq('plan_date', dateStr)
      .maybeSingle();

    if (planData) {
      setDailyPlan({
        ...planData,
        top_priorities: (planData.top_priorities as string[]) || [],
        scheduled_tasks: (planData.scheduled_tasks as any[]) || [],
        energy_level: planData.energy_level as 'low' | 'medium' | 'high',
      });
    } else {
      setDailyPlan(null);
    }
    setLoading(false);
  };

  const generateWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 6 }); // السبت
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const weekDays = generateWeekDays();

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  // تقسيم المهام حسب وقت اليوم
  const morningTasks = tasks.filter(t => t.category === 'work' || t.priority === 'urgent');
  const afternoonTasks = tasks.filter(t => t.category === 'learning' || t.priority === 'high');
  const eveningTasks = tasks.filter(t => t.category === 'personal' || t.category === 'health');

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* الهيدر */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">الخطة</h1>
        <p className="text-muted-foreground text-sm">
          نظّم يومك وحقق أهدافك
        </p>
      </header>

      {/* التبويبات */}
      <Tabs defaultValue="daily" className="animate-fade-in">
        <TabsList className="grid w-full grid-cols-2 bg-muted mb-6">
          <TabsTrigger value="daily">الخطة اليومية</TabsTrigger>
          <TabsTrigger value="weekly">الخطة الأسبوعية</TabsTrigger>
        </TabsList>

        {/* الخطة اليومية */}
        <TabsContent value="daily" className="space-y-6">
          {/* شريط الأسبوع */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <span className="font-medium">
                  {format(weekDays[0], 'd MMM', { locale: ar })} - {format(weekDays[6], 'd MMM', { locale: ar })}
                </span>
                <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-xl transition-all",
                      isSameDay(day, selectedDate) 
                        ? "bg-primary text-primary-foreground" 
                        : isToday(day)
                        ? "bg-accent/20 text-accent"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="text-xs opacity-70">
                      {format(day, 'EEE', { locale: ar })}
                    </span>
                    <span className="text-lg font-bold">
                      {format(day, 'd')}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ملخص اليوم */}
          <Card className="glass-card overflow-hidden">
            <div className="h-1 bg-gradient-to-l from-primary to-accent" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg">
                    {isToday(selectedDate) ? 'اليوم' : format(selectedDate, 'EEEE', { locale: ar })}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, 'd MMMM yyyy', { locale: ar })}
                  </p>
                </div>
                <Button className="btn-gradient" size="sm">
                  <Sparkles className="w-4 h-4 ml-2" />
                  رتّب يومي
                </Button>
              </div>

              {/* إحصائيات سريعة */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{tasks.length}</p>
                  <p className="text-xs text-muted-foreground">مهمة</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <p className="text-lg font-bold">
                    {Math.round(tasks.reduce((sum, t) => sum + (t.estimated_duration || 0), 0) / 60)}
                  </p>
                  <p className="text-xs text-muted-foreground">ساعة</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Zap className="w-5 h-5 mx-auto mb-1 text-warning" />
                  <p className="text-lg font-bold">
                    {tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length}
                  </p>
                  <p className="text-xs text-muted-foreground">عاجل</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* جدول اليوم */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* الصباح */}
              <TimeBlock 
                icon={Sun} 
                title="الصباح" 
                subtitle="8:00 - 12:00"
                tasks={morningTasks.slice(0, 3)}
                color="text-warning"
              />

              {/* الظهر */}
              <TimeBlock 
                icon={Sunset} 
                title="الظهيرة" 
                subtitle="12:00 - 17:00"
                tasks={afternoonTasks.slice(0, 3)}
                color="text-accent"
              />

              {/* المساء */}
              <TimeBlock 
                icon={Moon} 
                title="المساء" 
                subtitle="17:00 - 22:00"
                tasks={eveningTasks.slice(0, 3)}
                color="text-primary"
              />
            </div>
          )}
        </TabsContent>

        {/* الخطة الأسبوعية */}
        <TabsContent value="weekly" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                أهداف الأسبوع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center py-8">
                لم يتم تحديد أهداف لهذا الأسبوع بعد
              </p>
              <Button className="w-full btn-gradient">
                <Sparkles className="w-4 h-4 ml-2" />
                إنشاء خطة أسبوعية
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TimeBlock({ 
  icon: Icon, 
  title, 
  subtitle, 
  tasks, 
  color 
}: { 
  icon: React.ElementType; 
  title: string; 
  subtitle: string; 
  tasks: Task[];
  color: string;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("p-2 rounded-xl bg-muted", color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            لا توجد مهام مجدولة
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <div 
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  {task.estimated_duration && (
                    <p className="text-xs text-muted-foreground">
                      {task.estimated_duration} دقيقة
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {taskPriorityLabels[task.priority]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
