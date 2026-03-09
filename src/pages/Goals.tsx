import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Target, Plus, Trash2, CalendarDays, CalendarRange, Calendar,
  Clock, ChevronRight, ChevronLeft, Loader2, ListTodo, Check, RefreshCw, Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: 'monthly' | 'weekly' | 'daily';
  period_date: string;
  is_completed: boolean;
  fits_commitment_time: boolean | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export default function Goals() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [linkedGoalIds, setLinkedGoalIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState('');
  const [newFitsCommitment, setNewFitsCommitment] = useState(false);
  const [bulkConverting, setBulkConverting] = useState(false);

  // Navigation dates
  const [monthDate, setMonthDate] = useState(new Date());
  const [weekDate, setWeekDate] = useState(new Date());
  const [dayDate, setDayDate] = useState(new Date());

  const getPeriodDate = useCallback(() => {
    if (activeTab === 'monthly') return format(startOfMonth(monthDate), 'yyyy-MM-dd');
    if (activeTab === 'weekly') return format(startOfWeek(weekDate, { weekStartsOn: 6 }), 'yyyy-MM-dd');
    return format(dayDate, 'yyyy-MM-dd');
  }, [activeTab, monthDate, weekDate, dayDate]);

  const fetchLinkedGoals = useCallback(async (goalIds: string[]) => {
    if (!user || goalIds.length === 0) return new Set<string>();
    
    const { data } = await supabase
      .from('tasks')
      .select('goal_id')
      .eq('user_id', user.id)
      .in('goal_id', goalIds);
    
    return new Set((data || []).map(t => t.goal_id).filter(Boolean) as string[]);
  }, [user]);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let startDate: string, endDate: string;
    if (activeTab === 'monthly') {
      startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');
    } else if (activeTab === 'weekly') {
      startDate = format(startOfWeek(weekDate, { weekStartsOn: 6 }), 'yyyy-MM-dd');
      endDate = format(endOfWeek(weekDate, { weekStartsOn: 6 }), 'yyyy-MM-dd');
    } else {
      startDate = format(dayDate, 'yyyy-MM-dd');
      endDate = startDate;
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', activeTab)
      .gte('period_date', startDate)
      .lte('period_date', endDate)
      .order('order_index');

    if (error) {
      console.error('Error fetching goals:', error);
      toast.error('خطأ في جلب الأهداف');
    } else {
      const goalsData = (data || []) as Goal[];
      setGoals(goalsData);
      
      // Fetch linked goals
      const goalIds = goalsData.map(g => g.id);
      const linked = await fetchLinkedGoals(goalIds);
      setLinkedGoalIds(linked);
    }
    setLoading(false);
  }, [user, activeTab, monthDate, weekDate, dayDate, fetchLinkedGoals]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async () => {
    if (!user || !newGoal.trim()) return;

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: newGoal.trim(),
        type: activeTab,
        period_date: getPeriodDate(),
        fits_commitment_time: activeTab === 'daily' ? newFitsCommitment : null,
        order_index: goals.length,
      })
      .select()
      .single();

    if (error) {
      toast.error('خطأ في إضافة الهدف');
      return;
    }

    setGoals(prev => [...prev, data as Goal]);
    setNewGoal('');
    setNewFitsCommitment(false);
    toast.success('تم إضافة الهدف');
  };

  const toggleComplete = async (goal: Goal) => {
    const { error } = await supabase
      .from('goals')
      .update({ is_completed: !goal.is_completed })
      .eq('id', goal.id);

    if (error) {
      toast.error('خطأ في تحديث الهدف');
      return;
    }

    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, is_completed: !g.is_completed } : g));
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) {
      toast.error('خطأ في حذف الهدف');
      return;
    }
    setGoals(prev => prev.filter(g => g.id !== id));
    setLinkedGoalIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    toast.success('تم حذف الهدف');
  };

  const convertToTask = async (goal: Goal) => {
    if (linkedGoalIds.has(goal.id)) {
      toast.info('تم تحويل هذا الهدف مسبقاً');
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: user!.id,
        title: goal.title,
        status: 'pending',
        priority: 'medium',
        category: 'work',
        due_date: goal.type === 'daily' ? goal.period_date : null,
        goal_id: goal.id,
      });

    if (error) {
      toast.error('خطأ في إنشاء المهمة');
      return;
    }
    
    setLinkedGoalIds(prev => new Set([...prev, goal.id]));
    toast.success('تم تحويل الهدف إلى مهمة ✓');
  };

  const bulkConvertToTasks = async () => {
    const unconvertedGoals = goals.filter(g => !linkedGoalIds.has(g.id));
    
    if (unconvertedGoals.length === 0) {
      toast.info('جميع الأهداف محوّلة بالفعل');
      return;
    }

    setBulkConverting(true);
    
    const tasksToInsert = unconvertedGoals.map(goal => ({
      user_id: user!.id,
      title: goal.title,
      status: 'pending',
      priority: 'medium',
      category: 'work',
      due_date: goal.type === 'daily' ? goal.period_date : null,
      goal_id: goal.id,
    }));

    const { error } = await supabase.from('tasks').insert(tasksToInsert);

    if (error) {
      toast.error('خطأ في تحويل الأهداف');
      setBulkConverting(false);
      return;
    }

    const newLinked = new Set([...linkedGoalIds, ...unconvertedGoals.map(g => g.id)]);
    setLinkedGoalIds(newLinked);
    setBulkConverting(false);
    toast.success(`تم تحويل ${unconvertedGoals.length} أهداف إلى مهام ✓`);
  };

  const toggleFitsCommitment = async (goal: Goal) => {
    const newVal = !goal.fits_commitment_time;
    const { error } = await supabase
      .from('goals')
      .update({ fits_commitment_time: newVal })
      .eq('id', goal.id);

    if (error) {
      toast.error('خطأ في التحديث');
      return;
    }
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, fits_commitment_time: newVal } : g));
  };

  const completedCount = goals.filter(g => g.is_completed).length;
  const progress = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;
  const unconvertedCount = goals.filter(g => !linkedGoalIds.has(g.id)).length;

  const getPeriodLabel = () => {
    if (activeTab === 'monthly') return format(monthDate, 'MMMM yyyy', { locale: ar });
    if (activeTab === 'weekly') {
      const start = startOfWeek(weekDate, { weekStartsOn: 6 });
      const end = endOfWeek(weekDate, { weekStartsOn: 6 });
      return `${format(start, 'd MMM', { locale: ar })} - ${format(end, 'd MMM', { locale: ar })}`;
    }
    return format(dayDate, 'EEEE d MMMM', { locale: ar });
  };

  const navigatePrev = () => {
    if (activeTab === 'monthly') setMonthDate(m => subMonths(m, 1));
    else if (activeTab === 'weekly') setWeekDate(w => subWeeks(w, 1));
    else setDayDate(d => subDays(d, 1));
  };

  const navigateNext = () => {
    if (activeTab === 'monthly') setMonthDate(m => addMonths(m, 1));
    else if (activeTab === 'weekly') setWeekDate(w => addWeeks(w, 1));
    else setDayDate(d => addDays(d, 1));
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          الأهداف
        </h1>
        <p className="text-muted-foreground text-sm">حدد أهدافك وتابع تقدمك</p>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="animate-fade-in">
        <TabsList className="grid w-full grid-cols-3 bg-muted mb-6">
          <TabsTrigger value="monthly">شهري</TabsTrigger>
          <TabsTrigger value="weekly">أسبوعي</TabsTrigger>
          <TabsTrigger value="daily">يومي</TabsTrigger>
        </TabsList>

        {/* Period navigation */}
        <Card className="glass-card mb-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={navigateNext}>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <span className="font-bold text-sm">{getPeriodLabel()}</span>
              <Button variant="ghost" size="icon" onClick={navigatePrev}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress summary */}
        {goals.length > 0 && (
          <Card className="glass-card mb-4 overflow-hidden">
            <div 
              className="h-1 transition-all duration-500"
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(to left, hsl(var(--primary)), hsl(var(--accent)))'
              }}
            />
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {completedCount} من {goals.length} مكتمل
              </span>
              <span className="text-lg font-bold text-primary">{progress}%</span>
            </CardContent>
          </Card>
        )}

        {/* Add goal input */}
        <Card className="glass-card mb-4">
          <CardContent className="p-3 space-y-3">
            <div className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder={`أضف هدف ${activeTab === 'monthly' ? 'شهري' : activeTab === 'weekly' ? 'أسبوعي' : 'يومي'}...`}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                className="flex-1"
              />
              <Button onClick={addGoal} className="btn-gradient" disabled={!newGoal.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Fits commitment time toggle - only for daily */}
            {activeTab === 'daily' && newGoal.trim() && (
              <div className="flex items-center justify-between px-1 py-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground">يمكن تنفيذه وقت الالتزام</Label>
                </div>
                <Switch
                  checked={newFitsCommitment}
                  onCheckedChange={setNewFitsCommitment}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk convert button */}
        {goals.length > 0 && unconvertedCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full mb-4 gap-2"
                disabled={bulkConverting}
              >
                {bulkConverting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                تحويل كل الأهداف إلى مهام ({unconvertedCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تحويل الأهداف إلى مهام</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم تحويل {unconvertedCount} أهداف غير محوّلة إلى مهام جديدة.
                  الأهداف المحوّلة مسبقاً ستُتجاهل.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={bulkConvertToTasks}>
                  تأكيد التحويل
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Goals list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-primary/30 mx-auto mb-3" />
              <p className="text-muted-foreground">لا توجد أهداف لهذه الفترة</p>
              <p className="text-xs text-muted-foreground mt-1">ابدأ بإضافة أهدافك</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => {
              const isConverted = linkedGoalIds.has(goal.id);
              
              return (
                <Card key={goal.id} className={cn(
                  "glass-card transition-all",
                  goal.is_completed && "opacity-60"
                )}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={goal.is_completed}
                        onCheckedChange={() => toggleComplete(goal)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-sm",
                          goal.is_completed && "line-through text-muted-foreground"
                        )}>
                          {goal.title}
                        </p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {/* Converted badge */}
                          {isConverted && (
                            <Badge 
                              variant="outline" 
                              className="text-xs border-green-500/50 text-green-600 bg-green-500/10"
                            >
                              <Check className="w-3 h-3 ml-1" />
                              تم التحويل
                            </Badge>
                          )}
                          
                          {/* Fits commitment badge - daily only */}
                          {goal.type === 'daily' && goal.fits_commitment_time !== null && (
                            <button
                              onClick={() => toggleFitsCommitment(goal)}
                            >
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs cursor-pointer transition-colors",
                                  goal.fits_commitment_time 
                                    ? "border-accent/50 text-accent bg-accent/10" 
                                    : "border-destructive/50 text-destructive bg-destructive/10"
                                )}
                              >
                                <Clock className="w-3 h-3 ml-1" />
                                {goal.fits_commitment_time ? 'وقت الالتزام ✓' : 'خارج الالتزام'}
                              </Badge>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7 shrink-0",
                            isConverted 
                              ? "text-muted-foreground cursor-not-allowed" 
                              : "text-primary"
                          )}
                          title={isConverted ? "تم التحويل" : "حوّل إلى مهمة"}
                          onClick={() => convertToTask(goal)}
                          disabled={isConverted}
                        >
                          {isConverted ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <ListTodo className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive shrink-0"
                          onClick={() => deleteGoal(goal.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </Tabs>
    </div>
  );
}
