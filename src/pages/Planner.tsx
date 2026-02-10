import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Task, DailyPlan, taskPriorityLabels, Commitment, dayLabels } from '@/types/database';
import { useCommitments } from '@/hooks/useCommitments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CommitmentBlock } from '@/components/planner/CommitmentBlock';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon,
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
  Lock,
  Plus,
  MapPin,
  Trash2,
  FileText,
} from 'lucide-react';
import { 
  format, addDays, startOfWeek, isToday, isSameDay, 
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, 
  addMonths, subMonths, isSameMonth
} from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  color: string;
  location: string | null;
}

export default function Planner() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newLocation, setNewLocation] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [activeTab, setActiveTab] = useState('calendar');

  const { commitments, getCommitmentsForDay } = useCommitments();

  const getDayCode = (date: Date): string => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[date.getDay()];
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const [tasksRes, aptsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user!.id)
        .gte('due_date', monthStart)
        .lte('due_date', monthEnd + 'T23:59:59')
        .order('due_date'),
      supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user!.id)
        .gte('appointment_date', monthStart)
        .lte('appointment_date', monthEnd)
        .order('start_time'),
    ]);

    setTasks((tasksRes.data || []) as Task[]);
    setAppointments((aptsRes.data || []) as Appointment[]);
    setLoading(false);
  };

  // Calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Pad start (week starts Saturday = 6)
    const startDay = getDay(monthStart);
    const padStart = (startDay + 1) % 7; // shift for Saturday start
    const paddedDays: (Date | null)[] = Array(padStart).fill(null).concat(days);
    
    return paddedDays;
  }, [currentMonth]);

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayApts = appointments.filter(a => a.appointment_date === dateStr);
    const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr));
    return { appointments: dayApts, tasks: dayTasks };
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedEvents = getEventsForDate(selectedDate);
  const selectedDayCode = getDayCode(selectedDate);
  const dayCommitments = getCommitmentsForDay(selectedDayCode);

  const handleAddAppointment = async () => {
    if (!newTitle.trim()) return;

    const { error } = await supabase.from('appointments').insert({
      user_id: user!.id,
      title: newTitle.trim(),
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: newStartTime,
      end_time: newEndTime || null,
      description: newDesc.trim() || null,
      location: newLocation.trim() || null,
    });

    if (error) {
      toast.error('خطأ في إضافة الموعد');
      return;
    }

    toast.success('تم إضافة الموعد');
    setNewTitle('');
    setNewDesc('');
    setNewLocation('');
    setAddDialogOpen(false);
    fetchData();
  };

  const handleDeleteAppointment = async (id: string) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) {
      toast.error('خطأ في حذف الموعد');
      return;
    }
    toast.success('تم حذف الموعد');
    fetchData();
  };

  const weekDayHeaders = ['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع'];

  return (
    <div className="min-h-screen p-4 pb-24">
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">التقويم</h1>
        <p className="text-muted-foreground text-sm">مواعيدك ومهامك المجدولة</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
        <TabsList className="grid w-full grid-cols-3 bg-muted mb-6">
          <TabsTrigger value="calendar">الشهري</TabsTrigger>
          <TabsTrigger value="daily">اليومي</TabsTrigger>
          <TabsTrigger value="weekly">الأسبوعي</TabsTrigger>
        </TabsList>

        {/* التقويم الشهري */}
        <TabsContent value="calendar" className="space-y-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <h2 className="font-bold text-lg">
                  {format(currentMonth, 'MMMM yyyy', { locale: ar })}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDayHeaders.map(d => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`pad-${i}`} />;
                  
                  const events = getEventsForDate(day);
                  const hasApts = events.appointments.length > 0;
                  const hasTasks = events.tasks.length > 0;
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-h-[44px]",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : isCurrentDay
                          ? "bg-accent/20 text-accent"
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="text-sm font-medium">{format(day, 'd')}</span>
                      {(hasApts || hasTasks) && (
                        <div className="flex gap-0.5 mt-0.5">
                          {hasApts && <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-primary-foreground" : "bg-accent")} />}
                          {hasTasks && <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-primary-foreground/70" : "bg-primary")} />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected day detail */}
          <Card className="glass-card overflow-hidden">
            <div className="h-1 bg-gradient-to-l from-primary to-accent" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">
                    {isToday(selectedDate) ? 'اليوم' : format(selectedDate, 'EEEE', { locale: ar })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, 'd MMMM yyyy', { locale: ar })}
                  </p>
                </div>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="btn-gradient">
                      <Plus className="w-4 h-4 ml-1" />
                      موعد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>موعد جديد - {format(selectedDate, 'd MMMM', { locale: ar })}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div>
                        <Label>العنوان</Label>
                        <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="مثال: اجتماع عمل" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>من</Label>
                          <Input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} />
                        </div>
                        <div>
                          <Label>إلى</Label>
                          <Input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <Label>المكان (اختياري)</Label>
                        <Input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="مثال: مكتب الشركة" />
                      </div>
                      <div>
                        <Label>ملاحظات (اختياري)</Label>
                        <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="تفاصيل إضافية..." rows={2} />
                      </div>
                      <Button className="w-full btn-gradient" onClick={handleAddAppointment}>
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة الموعد
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* المواعيد */}
              {selectedEvents.appointments.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" /> المواعيد
                  </p>
                  <div className="space-y-2">
                    {selectedEvents.appointments.map(apt => (
                      <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: apt.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{apt.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{apt.start_time}{apt.end_time ? ` - ${apt.end_time}` : ''}</span>
                            {apt.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" />{apt.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteAppointment(apt.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* المهام المجدولة */}
              {selectedEvents.tasks.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" /> مهام مجدولة
                  </p>
                  <div className="space-y-2">
                    {selectedEvents.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{task.title}</p>
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(task.due_date), 'h:mm a', { locale: ar })}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">{taskPriorityLabels[task.priority]}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvents.appointments.length === 0 && selectedEvents.tasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد مواعيد أو مهام في هذا اليوم</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* اليومي */}
        <TabsContent value="daily" className="space-y-4">
          <DailyView 
            selectedDate={selectedDate} 
            setSelectedDate={setSelectedDate}
            tasks={tasks}
            appointments={appointments}
            dayCommitments={dayCommitments}
            loading={loading}
          />
        </TabsContent>

        {/* الأسبوعي */}
        <TabsContent value="weekly" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
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

function DailyView({ 
  selectedDate, setSelectedDate, tasks, appointments, dayCommitments, loading 
}: { 
  selectedDate: Date; 
  setSelectedDate: (d: Date) => void;
  tasks: Task[];
  appointments: Appointment[];
  dayCommitments: Commitment[];
  loading: boolean;
}) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 6 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const navigateWeek = (dir: 'prev' | 'next') => {
    setSelectedDate(addDays(selectedDate, dir === 'next' ? 7 : -7));
  };

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayApts = appointments.filter(a => a.appointment_date === dateStr);
  const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr));

  // Timeline hours
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

  const getItemsAtHour = (hour: number) => {
    const items: { type: 'appointment' | 'task' | 'commitment'; data: any; isSpan?: boolean }[] = [];
    
    dayApts.forEach(a => {
      const h = parseInt(a.start_time.split(':')[0]);
      if (h === hour) items.push({ type: 'appointment', data: a });
    });

    dayTasks.forEach(t => {
      if (t.due_date) {
        const h = new Date(t.due_date).getHours();
        if (h === hour) items.push({ type: 'task', data: t });
      }
    });

    return items;
  };

  // Check if an hour is within a commitment range
  const getCommitmentAtHour = (hour: number): Commitment | null => {
    for (const c of dayCommitments) {
      const startH = parseInt(c.start_time.split(':')[0]);
      const endH = parseInt(c.end_time.split(':')[0]);
      if (hour >= startH && hour < endH) return c;
    }
    return null;
  };

  const isCommitmentStart = (hour: number): boolean => {
    return dayCommitments.some(c => parseInt(c.start_time.split(':')[0]) === hour);
  };

  const getCommitmentSpanHeight = (hour: number): number => {
    for (const c of dayCommitments) {
      const startH = parseInt(c.start_time.split(':')[0]);
      if (startH === hour) {
        const endH = parseInt(c.end_time.split(':')[0]);
        return endH - startH;
      }
    }
    return 0;
  };

  return (
    <>
      {/* Week strip */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronRight className="w-5 h-5" />
            </Button>
            <span className="font-medium text-sm">
              {format(weekDays[0], 'd MMM', { locale: ar })} - {format(weekDays[6], 'd MMM', { locale: ar })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex flex-col items-center p-2 rounded-xl transition-all",
                  isSameDay(day, selectedDate) ? "bg-primary text-primary-foreground" : isToday(day) ? "bg-accent/20 text-accent" : "hover:bg-muted"
                )}
              >
                <span className="text-xs opacity-70">{format(day, 'EEE', { locale: ar })}</span>
                <span className="text-lg font-bold">{format(day, 'd')}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="glass-card overflow-hidden">
        <div className="h-1 bg-gradient-to-l from-primary to-accent" />
        <CardContent className="p-4">
          <h3 className="font-bold mb-4">
            {isToday(selectedDate) ? 'اليوم' : format(selectedDate, 'EEEE d MMMM', { locale: ar })}
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="relative">
              {hours.map(hour => {
                const items = getItemsAtHour(hour);
                const commitment = getCommitmentAtHour(hour);
                const isStart = isCommitmentStart(hour);
                const isCurrentHour = isToday(selectedDate) && new Date().getHours() === hour;
                const isWithinCommitment = commitment && !isStart;
                
                return (
                  <div key={hour} className={cn(
                    "flex gap-3 py-2 border-b border-border/30 relative",
                    isCurrentHour && "bg-primary/5 -mx-4 px-4 rounded-lg",
                    isWithinCommitment && "bg-secondary/30",
                  )}>
                    <span className={cn("text-xs w-10 shrink-0 pt-1 text-left", isCurrentHour ? "text-primary font-bold" : "text-muted-foreground")}>
                      {hour > 12 ? `${hour - 12} م` : hour === 12 ? '12 م' : `${hour} ص`}
                    </span>
                    <div className="flex-1 min-h-[28px]">
                      {/* Commitment block at start hour */}
                      {isStart && commitment && (
                        <div className="text-xs p-2.5 rounded-lg mb-1 bg-secondary/40 border border-secondary/60">
                          <span className="font-medium">🔒 {commitment.title}</span>
                          <span className="text-muted-foreground mr-2">
                            {commitment.start_time} - {commitment.end_time}
                          </span>
                        </div>
                      )}
                      {/* Regular items */}
                      {items.map((item, idx) => (
                        <div key={idx} className={cn(
                          "text-xs p-2 rounded-lg mb-1",
                          item.type === 'appointment' && "bg-accent/15 border border-accent/30",
                          item.type === 'task' && "bg-primary/15 border border-primary/30",
                        )}>
                          <span className="font-medium">{item.data.title}</span>
                          <span className="text-muted-foreground mr-2">
                            {item.type === 'appointment' && (
                              <>{item.data.start_time}{item.data.end_time ? ` - ${item.data.end_time}` : ''}</>
                            )}
                            {item.type === 'task' && item.data.due_date && (
                              <>{format(new Date(item.data.due_date), 'h:mm a', { locale: ar })}</>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
