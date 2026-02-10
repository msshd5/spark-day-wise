import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Target, Plus, Check, Flame, Calendar, Pencil, Trash2, TrendingUp, BarChart3 } from 'lucide-react';
import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Habit {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  target_count: number;
  is_active: boolean;
  created_at: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  log_date: string;
  completed_count: number;
}

export default function Habits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState('#8B5CF6');
  const [targetCount, setTargetCount] = useState(1);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: new Date() });

  useEffect(() => {
    if (user) {
      fetchHabits();
      fetchLogs();
    }
  }, [user]);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setHabits(data as Habit[]);
    }
    setLoading(false);
  };

  const fetchLogs = async () => {
    const monthAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('log_date', monthAgo);

    if (data) {
      setLogs(data as HabitLog[]);
    }
  };

  const handleAddHabit = async () => {
    if (!title.trim()) return;

    const { error } = await supabase.from('habits').insert({
      user_id: user!.id,
      title: title.trim(),
      description: description.trim() || null,
      icon,
      color,
      target_count: targetCount,
    });

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في إضافة العادة', variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: 'تمت إضافة العادة بنجاح' });
      resetForm();
      setShowAddDialog(false);
      fetchHabits();
    }
  };

  const handleUpdateHabit = async () => {
    if (!editingHabit || !title.trim()) return;

    const { error } = await supabase
      .from('habits')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        icon,
        color,
        target_count: targetCount,
      })
      .eq('id', editingHabit.id);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في تحديث العادة', variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: 'تم تحديث العادة بنجاح' });
      resetForm();
      setEditingHabit(null);
      fetchHabits();
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', habitId);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في حذف العادة', variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: 'تم حذف العادة' });
      fetchHabits();
      fetchLogs();
    }
  };

  const toggleHabitToday = async (habit: Habit) => {
    const existingLog = logs.find(
      (l) => l.habit_id === habit.id && l.log_date === today
    );

    if (existingLog) {
      // إزالة السجل
      await supabase.from('habit_logs').delete().eq('id', existingLog.id);
    } else {
      // إضافة سجل جديد
      await supabase.from('habit_logs').insert({
        user_id: user!.id,
        habit_id: habit.id,
        log_date: today,
        completed_count: 1,
      });
    }

    fetchLogs();
  };

  const isHabitCompletedOnDate = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return logs.some((l) => l.habit_id === habitId && l.log_date === dateStr);
  };

  const getHabitStreak = (habitId: string) => {
    let streak = 0;
    let currentDate = new Date();

    while (true) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const hasLog = logs.some((l) => l.habit_id === habitId && l.log_date === dateStr);

      if (hasLog) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const getWeekProgress = (habitId: string) => {
    const completedDays = weekDays.filter((day) =>
      isHabitCompletedOnDate(habitId, day)
    ).length;
    return Math.round((completedDays / 7) * 100);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIcon('📌');
    setColor('#8B5CF6');
    setTargetCount(1);
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setTitle(habit.title);
    setDescription(habit.description || '');
    setIcon(habit.icon);
    setColor(habit.color);
    setTargetCount(habit.target_count);
  };

  const icons = ['📌', '💪', '📚', '🏃', '💧', '🧘', '✍️', '🎯', '⏰', '🌅', '🌙', '💤', '🍎', '🧠', '💰'];
  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1'];

  const completedToday = habits.filter((h) =>
    logs.some((l) => l.habit_id === h.id && l.log_date === today)
  ).length;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-7 h-7 text-primary" />
          العادات
        </h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="btn-gradient" onClick={resetForm}>
              <Plus className="w-4 h-4 ml-1" />
              إضافة عادة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عادة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>اسم العادة *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: قراءة 30 دقيقة"
                />
              </div>
              <div>
                <Label>الوصف</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف اختياري"
                />
              </div>
              <div>
                <Label>الأيقونة</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {icons.map((i) => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        icon === i ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>اللون</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        color === c ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleAddHabit} className="w-full btn-gradient">
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ملخص اليوم */}
      <Card className="glass-card">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تقدم اليوم</p>
                <p className="font-bold text-lg">
                  {completedToday} / {habits.length} عادة
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE', { locale: ar })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), 'd MMMM yyyy', { locale: ar })}
              </p>
            </div>
          </div>
          <Progress
            value={habits.length > 0 ? (completedToday / habits.length) * 100 : 0}
            className="mt-3 h-2"
          />
        </CardContent>
      </Card>

      {/* رسم بياني شهري */}
      <MonthlyChart habits={habits} logs={logs} />

      {/* قائمة العادات */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
      ) : habits.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">لا توجد عادات بعد</p>
            <p className="text-sm text-muted-foreground">أضف عادتك الأولى للبدء</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const isCompletedToday = isHabitCompletedOnDate(habit.id, new Date());
            const streak = getHabitStreak(habit.id);
            const weekProgress = getWeekProgress(habit.id);

            return (
              <Card key={habit.id} className="glass-card overflow-hidden">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    {/* زر الإنجاز */}
                    <button
                      onClick={() => toggleHabitToday(habit)}
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                        isCompletedToday
                          ? 'bg-green-500 text-white'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      style={{
                        backgroundColor: isCompletedToday ? habit.color : undefined,
                      }}
                    >
                      {isCompletedToday ? <Check className="w-6 h-6" /> : habit.icon}
                    </button>

                    {/* معلومات العادة */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{habit.title}</h3>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditDialog(habit)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDeleteHabit(habit.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {habit.description && (
                        <p className="text-sm text-muted-foreground">{habit.description}</p>
                      )}

                      {/* الـ Streak والتقدم */}
                      <div className="flex items-center gap-4 mt-2">
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">{streak}</span>
                            <span className="text-muted-foreground">يوم</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{weekProgress}% هذا الأسبوع</span>
                        </div>
                      </div>

                      {/* أيام الأسبوع */}
                      <div className="flex gap-1 mt-2">
                        {weekDays.map((day) => {
                          const isCompleted = isHabitCompletedOnDate(habit.id, day);
                          const isToday = isSameDay(day, new Date());

                          return (
                            <div
                              key={day.toISOString()}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                isCompleted
                                  ? 'text-white'
                                  : isToday
                                  ? 'border-2 border-primary text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                              style={{
                                backgroundColor: isCompleted ? habit.color : undefined,
                              }}
                              title={format(day, 'EEEE', { locale: ar })}
                            >
                              {format(day, 'EEE', { locale: ar }).charAt(0)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog تعديل العادة */}
      <Dialog open={!!editingHabit} onOpenChange={() => setEditingHabit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل العادة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>اسم العادة *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: قراءة 30 دقيقة"
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف اختياري"
              />
            </div>
            <div>
              <Label>الأيقونة</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {icons.map((i) => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                      icon === i ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>اللون</Label>
              <div className="flex gap-2 mt-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleUpdateHabit} className="w-full btn-gradient">
              حفظ التغييرات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MonthlyChart({ habits, logs }: { habits: Habit[]; logs: HabitLog[] }) {
  const chartData = useMemo(() => {
    const days: { date: string; label: string; completed: number; total: number; rate: number }[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dateStr = format(day, 'yyyy-MM-dd');
      const completed = new Set(
        logs.filter(l => l.log_date === dateStr).map(l => l.habit_id)
      ).size;
      const total = habits.length;
      
      days.push({
        date: dateStr,
        label: format(day, 'd', { locale: ar }),
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }
    
    return days;
  }, [habits, logs]);

  const avgRate = chartData.length > 0 
    ? Math.round(chartData.reduce((s, d) => s + d.rate, 0) / chartData.length) 
    : 0;

  if (habits.length === 0) return null;

  return (
    <Card className="glass-card">
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-bold">التقدم الشهري</h3>
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold text-primary">{avgRate}%</span>
            <p className="text-xs text-muted-foreground">المعدل</p>
          </div>
        </div>

        <div className="h-48 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                width={35}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                  direction: 'rtl',
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value}%`, 'نسبة الإنجاز']}
                labelFormatter={(label) => `يوم ${label}`}
              />
              <Bar 
                dataKey="rate" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}