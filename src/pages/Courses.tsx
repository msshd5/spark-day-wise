import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  GraduationCap, Plus, Trash2, Play, Pause, CheckCircle2, 
  Loader2, Edit2, ExternalLink, BookOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  user_id: string;
  title: string;
  platform: string | null;
  instructor: string | null;
  url: string | null;
  total_lessons: number;
  completed_lessons: number;
  status: string;
  notes: string | null;
  color: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  in_progress: 'قيد التعلم',
  completed: 'مكتمل',
  paused: 'متوقف',
  not_started: 'لم يبدأ',
};

const statusColors: Record<string, string> = {
  in_progress: 'text-primary bg-primary/10',
  completed: 'text-accent bg-accent/10',
  paused: 'text-warning bg-warning/10',
  not_started: 'text-muted-foreground bg-muted',
};

const platformColors: Record<string, string> = {
  'Udemy': '#a435f0',
  'Coursera': '#0056d2',
  'YouTube': '#ff0000',
  'Skillshare': '#00ff84',
  'LinkedIn Learning': '#0077b5',
  'أخرى': '#6b7280',
};

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const [form, setForm] = useState({
    title: '',
    platform: '',
    instructor: '',
    url: '',
    total_lessons: 0,
    completed_lessons: 0,
    status: 'not_started',
    notes: '',
    color: '#f59e0b',
  });

  useEffect(() => {
    if (user) fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      setCourses((data || []) as Course[]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      title: '',
      platform: '',
      instructor: '',
      url: '',
      total_lessons: 0,
      completed_lessons: 0,
      status: 'not_started',
      notes: '',
      color: '#f59e0b',
    });
    setEditingCourse(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('أدخل اسم الكورس');
      return;
    }

    const payload = {
      user_id: user!.id,
      title: form.title.trim(),
      platform: form.platform || null,
      instructor: form.instructor || null,
      url: form.url || null,
      total_lessons: form.total_lessons,
      completed_lessons: form.completed_lessons,
      status: form.status,
      notes: form.notes || null,
      color: form.color,
    };

    if (editingCourse) {
      const { error } = await supabase
        .from('courses')
        .update(payload)
        .eq('id', editingCourse.id);

      if (error) {
        toast.error('خطأ في تحديث الكورس');
        return;
      }
      toast.success('تم تحديث الكورس');
    } else {
      const { error } = await supabase
        .from('courses')
        .insert(payload);

      if (error) {
        toast.error('خطأ في إضافة الكورس');
        return;
      }
      toast.success('تم إضافة الكورس');
    }

    setDialogOpen(false);
    resetForm();
    fetchCourses();
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      platform: course.platform || '',
      instructor: course.instructor || '',
      url: course.url || '',
      total_lessons: course.total_lessons,
      completed_lessons: course.completed_lessons,
      status: course.status,
      notes: course.notes || '',
      color: course.color,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) {
      toast.error('خطأ في حذف الكورس');
      return;
    }
    toast.success('تم حذف الكورس');
    fetchCourses();
  };

  const incrementLesson = async (course: Course) => {
    if (course.completed_lessons >= course.total_lessons) return;
    
    const newCompleted = course.completed_lessons + 1;
    const newStatus = newCompleted === course.total_lessons ? 'completed' : 'in_progress';
    
    const { error } = await supabase
      .from('courses')
      .update({ 
        completed_lessons: newCompleted,
        status: newStatus 
      })
      .eq('id', course.id);

    if (error) {
      toast.error('خطأ في التحديث');
      return;
    }

    setCourses(prev => prev.map(c => 
      c.id === course.id 
        ? { ...c, completed_lessons: newCompleted, status: newStatus }
        : c
    ));

    if (newStatus === 'completed') {
      toast.success('🎉 مبروك! أكملت الكورس');
    } else {
      toast.success('تم تسجيل الدرس ✓');
    }
  };

  const filteredCourses = courses.filter(c => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  const inProgressCount = courses.filter(c => c.status === 'in_progress').length;
  const completedCount = courses.filter(c => c.status === 'completed').length;

  return (
    <div className="min-h-screen p-4 pb-24">
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          الكورسات
        </h1>
        <p className="text-muted-foreground text-sm">تتبع تقدمك في التعلم</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Play className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">قيد التعلم</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">مكتمل</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
        <TabsList className="grid w-full grid-cols-4 bg-muted mb-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="in_progress">قيد التعلم</TabsTrigger>
          <TabsTrigger value="completed">مكتمل</TabsTrigger>
          <TabsTrigger value="paused">متوقف</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Courses List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="glass-card animate-fade-in">
          <CardContent className="p-8 text-center">
            <GraduationCap className="w-12 h-12 text-primary/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              {activeTab === 'all' ? 'لا توجد كورسات مسجلة' : 'لا توجد كورسات في هذه الفئة'}
            </p>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="btn-gradient">
                  <Plus className="w-4 h-4 ml-2" />
                  أضف كورس
                </Button>
              </DialogTrigger>
              <CourseDialog form={form} setForm={setForm} onSave={handleSave} editing={!!editingCourse} />
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {filteredCourses.map((course) => {
            const progress = course.total_lessons > 0 
              ? Math.round((course.completed_lessons / course.total_lessons) * 100)
              : 0;
            
            return (
              <Card key={course.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${course.color}20` }}
                    >
                      <BookOpen className="w-6 h-6" style={{ color: course.color }} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-sm truncate">{course.title}</h3>
                          {course.instructor && (
                            <p className="text-xs text-muted-foreground">{course.instructor}</p>
                          )}
                        </div>
                        <Badge className={cn("text-xs shrink-0", statusColors[course.status])}>
                          {statusLabels[course.status]}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {course.platform && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ 
                              borderColor: platformColors[course.platform] || '#6b7280',
                              color: platformColors[course.platform] || '#6b7280'
                            }}
                          >
                            {course.platform}
                          </Badge>
                        )}
                        {course.url && (
                          <a href={course.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </a>
                        )}
                      </div>

                      {course.total_lessons > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              {course.completed_lessons} / {course.total_lessons} درس
                            </span>
                            <span className="font-bold">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    {course.status !== 'completed' && course.total_lessons > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => incrementLesson(course)}
                        className="text-xs"
                      >
                        <CheckCircle2 className="w-3 h-3 ml-1" />
                        أكملت درس
                      </Button>
                    )}
                    <div className="flex gap-1 mr-auto">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(course)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(course.id)}>
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

      {/* Add Button */}
      {filteredCourses.length > 0 && (
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-gradient fixed bottom-24 left-4 shadow-lg">
              <Plus className="w-5 h-5 ml-2" />
              أضف كورس
            </Button>
          </DialogTrigger>
          <CourseDialog form={form} setForm={setForm} onSave={handleSave} editing={!!editingCourse} />
        </Dialog>
      )}
    </div>
  );
}

function CourseDialog({
  form,
  setForm,
  onSave,
  editing,
}: {
  form: any;
  setForm: any;
  onSave: () => void;
  editing: boolean;
}) {
  const platforms = ['Udemy', 'Coursera', 'YouTube', 'Skillshare', 'LinkedIn Learning', 'أخرى'];
  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editing ? 'تعديل الكورس' : 'إضافة كورس جديد'}</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 mt-4">
        <div>
          <Label>اسم الكورس *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
            placeholder="مثال: أساسيات البرمجة"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>المنصة</Label>
            <Select value={form.platform} onValueChange={(v) => setForm((p: any) => ({ ...p, platform: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="اختر" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الحالة</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p: any) => ({ ...p, status: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">لم يبدأ</SelectItem>
                <SelectItem value="in_progress">قيد التعلم</SelectItem>
                <SelectItem value="paused">متوقف</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>المدرب</Label>
          <Input
            value={form.instructor}
            onChange={(e) => setForm((p: any) => ({ ...p, instructor: e.target.value }))}
            placeholder="اسم المدرب"
            className="mt-1"
          />
        </div>

        <div>
          <Label>رابط الكورس</Label>
          <Input
            type="url"
            value={form.url}
            onChange={(e) => setForm((p: any) => ({ ...p, url: e.target.value }))}
            placeholder="https://..."
            className="mt-1"
            dir="ltr"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>عدد الدروس</Label>
            <Input
              type="number"
              min={0}
              value={form.total_lessons}
              onChange={(e) => setForm((p: any) => ({ ...p, total_lessons: parseInt(e.target.value) || 0 }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>المكتمل</Label>
            <Input
              type="number"
              min={0}
              max={form.total_lessons}
              value={form.completed_lessons}
              onChange={(e) => setForm((p: any) => ({ ...p, completed_lessons: parseInt(e.target.value) || 0 }))}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label>اللون</Label>
          <div className="flex gap-2 mt-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setForm((p: any) => ({ ...p, color: c }))}
                className={cn(
                  "w-8 h-8 rounded-full transition-all",
                  form.color === c && "ring-2 ring-offset-2 ring-primary"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label>ملاحظات</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm((p: any) => ({ ...p, notes: e.target.value }))}
            placeholder="ملاحظات إضافية..."
            className="mt-1"
            rows={2}
          />
        </div>

        <Button onClick={onSave} className="w-full btn-gradient">
          {editing ? 'حفظ التعديلات' : 'إضافة الكورس'}
        </Button>
      </div>
    </DialogContent>
  );
}
