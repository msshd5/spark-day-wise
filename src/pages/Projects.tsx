import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Project, Task, projectStatusLabels } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  FolderKanban,
  Loader2,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const projectColors = [
  '#8B5CF6', // بنفسجي
  '#06B6D4', // سماوي
  '#10B981', // أخضر
  '#F59E0B', // برتقالي
  '#EF4444', // أحمر
  '#EC4899', // وردي
  '#6366F1', // نيلي
  '#84CC16', // أخضر فاتح
];

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<(Project & { tasks?: Task[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    // جلب المشاريع
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('خطأ في جلب المشاريع:', projectsError);
      toast.error('حدث خطأ في جلب المشاريع');
      setLoading(false);
      return;
    }

    // جلب المهام لكل مشروع
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user!.id)
      .not('project_id', 'is', null);

    if (tasksError) {
      console.error('خطأ في جلب المهام:', tasksError);
    }

    // دمج المهام مع المشاريع
    const projectsWithTasks = (projectsData || []).map(project => ({
      ...project,
      tasks: (tasksData || []).filter(task => task.project_id === project.id),
    })) as (Project & { tasks?: Task[] })[];

    setProjects(projectsWithTasks);
    setLoading(false);
  };

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      toast.error('حدث خطأ في حذف المشروع');
      return;
    }

    setProjects(prev => prev.filter(p => p.id !== projectId));
    toast.success('تم حذف المشروع');
  };

  const activeProjects = projects.filter(p => p.status === 'active');
  const otherProjects = projects.filter(p => p.status !== 'active');

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* الهيدر */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">المشاريع</h1>
        <p className="text-muted-foreground text-sm">
          {projects.length} مشروع • {activeProjects.length} نشط
        </p>
      </header>

      {/* قائمة المشاريع */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <FolderKanban className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground mb-4">لا توجد مشاريع</p>
            <Button onClick={() => setShowAddDialog(true)} className="btn-gradient">
              <Plus className="w-4 h-4 ml-2" />
              إنشاء مشروع جديد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* المشاريع النشطة */}
          {activeProjects.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                المشاريع النشطة ({activeProjects.length})
              </h2>
              <div className="space-y-3">
                {activeProjects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onDelete={() => deleteProject(project.id)}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* المشاريع الأخرى */}
          {otherProjects.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                مشاريع أخرى ({otherProjects.length})
              </h2>
              <div className="space-y-3">
                {otherProjects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onDelete={() => deleteProject(project.id)}
                  />
                ))}
              </div>
            </section>
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
            <DialogTitle>إنشاء مشروع جديد</DialogTitle>
          </DialogHeader>
          <AddProjectForm 
            userId={user!.id} 
            onSuccess={() => {
              setShowAddDialog(false);
              fetchProjects();
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({ 
  project, 
  onDelete 
}: { 
  project: Project & { tasks?: Task[] }; 
  onDelete: () => void;
}) {
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const statusColors = {
    active: 'bg-success/20 text-success',
    completed: 'bg-primary/20 text-primary',
    paused: 'bg-warning/20 text-warning',
    archived: 'bg-muted text-muted-foreground',
  };

  return (
    <Card className="glass-card overflow-hidden">
      <div 
        className="h-1.5" 
        style={{ backgroundColor: project.color }}
      />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg truncate">{project.name}</h3>
              <Badge className={cn("text-xs", statusColors[project.status])}>
                {projectStatusLabels[project.status]}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            )}
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

        {/* شريط التقدم */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">التقدم</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3 h-3" />
            {completedTasks} من {tasks.length} مهمة
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddProjectForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(projectColors[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم المشروع');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('projects').insert({
      user_id: userId,
      name: name.trim(),
      description: description.trim() || null,
      color,
    });

    setLoading(false);

    if (error) {
      toast.error('حدث خطأ في إنشاء المشروع');
      return;
    }

    toast.success('تم إنشاء المشروع بنجاح');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">اسم المشروع *</Label>
        <Input
          id="name"
          placeholder="مثال: تطوير التطبيق"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-input border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">الوصف</Label>
        <Textarea
          id="description"
          placeholder="وصف مختصر للمشروع..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-input border-border resize-none"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>اللون</Label>
        <div className="flex flex-wrap gap-2">
          {projectColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full transition-all",
                color === c && "ring-2 ring-offset-2 ring-offset-background ring-primary"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full btn-gradient" disabled={loading}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إنشاء المشروع'}
      </Button>
    </form>
  );
}
