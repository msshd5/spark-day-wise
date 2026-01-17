import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, TaskPriority, TaskCategory, taskStatusLabels, taskPriorityLabels, taskCategoryLabels } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  Loader2,
  MoreVertical,
  Trash2,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

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
      .is('parent_task_id', null)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('خطأ في جلب المهام:', error);
      toast.error('حدث خطأ في جلب المهام');
    } else {
      setTasks((data || []) as Task[]);
    }
    setLoading(false);
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: completedAt })
      .eq('id', task.id);

    if (error) {
      toast.error('حدث خطأ في تحديث المهمة');
      return;
    }

    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: newStatus, completed_at: completedAt } : t
    ));
    
    if (newStatus === 'completed') {
      toast.success('أحسنت! تم إكمال المهمة ✓');
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast.error('حدث خطأ في حذف المهمة');
      return;
    }

    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success('تم حذف المهمة');
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const groupedTasks = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    postponed: filteredTasks.filter(t => t.status === 'postponed'),
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* الهيدر */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">المهام</h1>
        <p className="text-muted-foreground text-sm">
          {tasks.length} مهمة • {tasks.filter(t => t.status === 'completed').length} مكتملة
        </p>
      </header>

      {/* شريط البحث والفلتر */}
      <div className="flex gap-2 mb-6 animate-fade-in">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مهمة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-card border-border"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | 'all')}>
          <SelectTrigger className="w-32 bg-card border-border">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending">جديد</SelectItem>
            <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="postponed">مؤجل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* قائمة المهام */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <Circle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد مهام'}
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="btn-gradient">
              <Plus className="w-4 h-4 ml-2" />
              أضف مهمة جديدة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* المهام قيد التنفيذ */}
          {groupedTasks.in_progress.length > 0 && (
            <TaskGroup 
              title="قيد التنفيذ" 
              tasks={groupedTasks.in_progress} 
              onToggle={toggleTaskStatus}
              onDelete={deleteTask}
            />
          )}

          {/* المهام الجديدة */}
          {groupedTasks.pending.length > 0 && (
            <TaskGroup 
              title="في الانتظار" 
              tasks={groupedTasks.pending} 
              onToggle={toggleTaskStatus}
              onDelete={deleteTask}
            />
          )}

          {/* المهام المكتملة */}
          {groupedTasks.completed.length > 0 && (
            <TaskGroup 
              title="مكتملة" 
              tasks={groupedTasks.completed} 
              onToggle={toggleTaskStatus}
              onDelete={deleteTask}
              collapsed
            />
          )}

          {/* المهام المؤجلة */}
          {groupedTasks.postponed.length > 0 && (
            <TaskGroup 
              title="مؤجلة" 
              tasks={groupedTasks.postponed} 
              onToggle={toggleTaskStatus}
              onDelete={deleteTask}
              collapsed
            />
          )}
        </div>
      )}

      {/* زر الإضافة العائم */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-24 left-4 w-14 h-14 rounded-full shadow-glow btn-gradient"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-card border-border max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>إضافة مهمة جديدة</DialogTitle>
          </DialogHeader>
          <AddTaskForm 
            userId={user!.id} 
            onSuccess={() => {
              setShowAddDialog(false);
              fetchTasks();
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskGroup({ 
  title, 
  tasks, 
  onToggle, 
  onDelete,
  collapsed = false 
}: { 
  title: string; 
  tasks: Task[]; 
  onToggle: (task: Task) => void;
  onDelete: (taskId: string) => void;
  collapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  return (
    <div>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full mb-2 px-1"
      >
        <span className="text-sm font-medium text-muted-foreground">
          {title} ({tasks.length})
        </span>
      </button>
      
      {!isCollapsed && (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onToggle={() => onToggle(task)}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskItem({ 
  task, 
  onToggle,
  onDelete 
}: { 
  task: Task; 
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isCompleted = task.status === 'completed';
  
  const priorityColors = {
    urgent: 'border-r-priority-urgent',
    high: 'border-r-priority-high',
    medium: 'border-r-priority-medium',
    low: 'border-r-priority-low',
  };

  const categoryColors = {
    work: 'bg-category-work/20 text-category-work',
    learning: 'bg-category-learning/20 text-category-learning',
    health: 'bg-category-health/20 text-category-health',
    personal: 'bg-category-personal/20 text-category-personal',
    other: 'bg-category-other/20 text-category-other',
  };

  return (
    <Card className={cn(
      "glass-card border-r-4 transition-all",
      priorityColors[task.priority],
      isCompleted && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={onToggle}
            className="mt-1 data-[state=checked]:bg-success data-[state=checked]:border-success"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-medium",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className={cn("text-xs", categoryColors[task.category])}>
                {taskCategoryLabels[task.category]}
              </Badge>
              
              {task.due_date && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.due_date), 'd MMM', { locale: ar })}
                </span>
              )}
              
              {task.estimated_duration && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.estimated_duration} دقيقة
                </span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 ml-2" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function AddTaskForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [estimatedDuration, setEstimatedDuration] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('يرجى إدخال عنوان المهمة');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('tasks').insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      priority,
      category,
      estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
    });

    setLoading(false);

    if (error) {
      toast.error('حدث خطأ في إضافة المهمة');
      return;
    }

    toast.success('تمت إضافة المهمة بنجاح');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">العنوان *</Label>
        <Input
          id="title"
          placeholder="مثال: إنهاء تقرير المبيعات"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-input border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">الوصف</Label>
        <Textarea
          id="description"
          placeholder="تفاصيل إضافية..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-input border-border resize-none"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>الأولوية</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(taskPriorityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>التصنيف</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(taskCategoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">المدة المتوقعة (بالدقائق)</Label>
        <Input
          id="duration"
          type="number"
          placeholder="30"
          value={estimatedDuration}
          onChange={(e) => setEstimatedDuration(e.target.value)}
          className="bg-input border-border"
          min="1"
        />
      </div>

      <Button type="submit" className="w-full btn-gradient" disabled={loading}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إضافة المهمة'}
      </Button>
    </form>
  );
}
