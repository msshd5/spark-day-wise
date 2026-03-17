import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Project, Task, ProjectFile, ProjectNote, taskStatusLabels, taskPriorityLabels, projectStatusLabels } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  Loader2, 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Users, 
  StickyNote,
  Download,
  File,
  Image as ImageIcon,
  FileArchive,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [notes, setNotes] = useState<ProjectNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchAll();
    }
  }, [user, id]);

  const fetchAll = async () => {
    setLoading(true);
    const [projectRes, tasksRes, filesRes, notesRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id!).eq('user_id', user!.id).single(),
      supabase.from('tasks').select('*').eq('project_id', id!).eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('project_files').select('*').eq('project_id', id!).eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('project_notes').select('*').eq('project_id', id!).eq('user_id', user!.id).limit(1),
    ]);

    if (projectRes.error || !projectRes.data) {
      toast.error('المشروع غير موجود');
      navigate('/projects');
      return;
    }

    setProject(projectRes.data as unknown as Project);
    setTasks((tasksRes.data || []) as unknown as Task[]);
    setFiles((filesRes.data || []) as unknown as ProjectFile[]);
    
    const noteData = notesRes.data?.[0];
    if (noteData) {
      setNotes(noteData as unknown as ProjectNote);
      setNoteContent((noteData as any).content || '');
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    for (const file of Array.from(selectedFiles)) {
      const filePath = `${user!.id}/${id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`خطأ في رفع ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      await supabase.from('project_files').insert({
        project_id: id!,
        user_id: user!.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type || null,
        file_size: file.size,
      });
    }

    toast.success('تم رفع الملفات بنجاح');
    setUploading(false);
    fetchAll();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteFile = async (fileId: string, fileUrl: string) => {
    // Extract path from URL
    const urlParts = fileUrl.split('/project-files/');
    if (urlParts[1]) {
      await supabase.storage.from('project-files').remove([urlParts[1]]);
    }
    await supabase.from('project_files').delete().eq('id', fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success('تم حذف الملف');
  };

  const saveNote = async () => {
    setSavingNote(true);
    if (notes) {
      await supabase.from('project_notes').update({ content: noteContent }).eq('id', notes.id);
    } else {
      const { data } = await supabase.from('project_notes').insert({
        project_id: id!,
        user_id: user!.id,
        content: noteContent,
      }).select().single();
      if (data) setNotes(data as unknown as ProjectNote);
    }
    setSavingNote(false);
    toast.success('تم حفظ الملاحظات');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const getFileIcon = (type: string | null) => {
    if (!type) return <File className="w-5 h-5" />;
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-accent" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-destructive" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className="w-5 h-5 text-warning" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="mb-3 text-muted-foreground">
          <ArrowRight className="w-4 h-4 ml-1" />
          العودة للمشاريع
        </Button>
        
        <div className="flex items-start gap-3">
          <div className="w-3 h-12 rounded-full" style={{ backgroundColor: project.color }} />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn("text-xs", {
                'bg-success/20 text-success': project.status === 'active',
                'bg-primary/20 text-primary': project.status === 'completed',
                'bg-warning/20 text-warning': project.status === 'paused',
                'bg-muted text-muted-foreground': project.status === 'archived',
              })}>
                {projectStatusLabels[project.status]}
              </Badge>
              {project.collaborators && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Users className="w-3 h-3" />
                  {project.collaborators}
                </Badge>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        <Card className="glass-card mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">التقدم الكلي</span>
              <span className="font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2.5" />
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3 h-3" />
              {completedTasks} من {tasks.length} مهمة مكتملة
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="animate-fade-in">
        <TabsList className="w-full bg-card mb-4">
          <TabsTrigger value="tasks" className="flex-1 text-xs">المهام ({tasks.length})</TabsTrigger>
          <TabsTrigger value="files" className="flex-1 text-xs">الملفات ({files.length})</TabsTrigger>
          <TabsTrigger value="notes" className="flex-1 text-xs">ملاحظات</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-3">
          {tasks.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">لا توجد مهام مرتبطة بهذا المشروع</p>
              </CardContent>
            </Card>
          ) : (
            tasks.map(task => (
              <Card key={task.id} className="glass-card">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", {
                    'bg-muted-foreground': task.status === 'pending',
                    'bg-accent': task.status === 'in_progress',
                    'bg-success': task.status === 'completed',
                    'bg-warning': task.status === 'postponed',
                  })} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", task.status === 'completed' && 'line-through text-muted-foreground')}>
                      {task.title}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {taskStatusLabels[task.status as keyof typeof taskStatusLabels] || task.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full btn-gradient"
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Upload className="w-4 h-4 ml-2" />}
            {uploading ? 'جارٍ الرفع...' : 'رفع ملفات'}
          </Button>

          {files.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">لا توجد ملفات مرفقة</p>
              </CardContent>
            </Card>
          ) : (
            files.map(file => (
              <Card key={file.id} className="glass-card">
                <CardContent className="p-3 flex items-center gap-3">
                  {getFileIcon(file.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteFile(file.id, file.file_url)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-3">
          <Textarea
            placeholder="اكتب ملاحظاتك هنا... أفكار، روابط، أي شيء متعلق بالمشروع"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="bg-input border-border min-h-[200px] resize-none"
            dir="auto"
          />
          <Button onClick={saveNote} className="w-full btn-gradient" disabled={savingNote}>
            {savingNote ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
            حفظ الملاحظات
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
