import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Loader2, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// X (Twitter) icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// LinkedIn icon
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface ContentIdea {
  id: string;
  platform: 'x' | 'linkedin';
  content: string;
  scheduledDate?: string;
  status: 'draft' | 'scheduled' | 'posted';
  createdAt: string;
}

export function SocialMediaPlanner() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newIdea, setNewIdea] = useState({
    platform: 'x' as 'x' | 'linkedin',
    content: '',
    scheduledDate: '',
  });

  // Load from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`social_ideas_${user.id}`);
      if (saved) {
        setIdeas(JSON.parse(saved));
      }
    }
  }, [user]);

  // Save to localStorage
  const saveIdeas = (newIdeas: ContentIdea[]) => {
    if (user) {
      localStorage.setItem(`social_ideas_${user.id}`, JSON.stringify(newIdeas));
      setIdeas(newIdeas);
    }
  };

  const addIdea = () => {
    if (!newIdea.content.trim()) {
      toast.error('اكتب محتوى المنشور');
      return;
    }

    const idea: ContentIdea = {
      id: Date.now().toString(),
      platform: newIdea.platform,
      content: newIdea.content,
      scheduledDate: newIdea.scheduledDate || undefined,
      status: newIdea.scheduledDate ? 'scheduled' : 'draft',
      createdAt: new Date().toISOString(),
    };

    saveIdeas([idea, ...ideas]);
    setNewIdea({ platform: 'x', content: '', scheduledDate: '' });
    setDialogOpen(false);
    toast.success('تم إضافة الفكرة');
  };

  const deleteIdea = (id: string) => {
    saveIdeas(ideas.filter(i => i.id !== id));
    toast.success('تم الحذف');
  };

  const markAsPosted = (id: string) => {
    saveIdeas(ideas.map(i => i.id === id ? { ...i, status: 'posted' as const } : i));
    toast.success('تم التحديث');
  };

  const upcomingIdeas = ideas.filter(i => i.status !== 'posted').slice(0, 3);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">تخطيط المحتوى</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>فكرة محتوى جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Button
                    variant={newIdea.platform === 'x' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewIdea(prev => ({ ...prev, platform: 'x' }))}
                    className="flex-1"
                  >
                    <XIcon className="w-4 h-4 ml-2" />
                    X
                  </Button>
                  <Button
                    variant={newIdea.platform === 'linkedin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewIdea(prev => ({ ...prev, platform: 'linkedin' }))}
                    className="flex-1"
                  >
                    <LinkedInIcon className="w-4 h-4 ml-2" />
                    LinkedIn
                  </Button>
                </div>

                <Textarea
                  placeholder="اكتب فكرة المحتوى..."
                  value={newIdea.content}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">تاريخ النشر (اختياري)</label>
                  <Input
                    type="date"
                    value={newIdea.scheduledDate}
                    onChange={(e) => setNewIdea(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    dir="ltr"
                  />
                </div>

                <Button onClick={addIdea} className="w-full btn-gradient">
                  إضافة الفكرة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {upcomingIdeas.length > 0 ? (
          <div className="space-y-2">
            {upcomingIdeas.map((idea) => (
              <div
                key={idea.id}
                className="p-3 rounded-lg bg-muted/50 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {idea.platform === 'x' ? (
                      <XIcon className="w-4 h-4 shrink-0" />
                    ) : (
                      <LinkedInIcon className="w-4 h-4 shrink-0" />
                    )}
                    <p className="text-sm line-clamp-2">{idea.content}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {idea.scheduledDate && (
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="w-3 h-3 ml-1" />
                        {format(new Date(idea.scheduledDate), 'd MMM', { locale: ar })}
                      </Badge>
                    )}
                    <Badge variant={idea.status === 'draft' ? 'outline' : 'default'} className="text-xs">
                      {idea.status === 'draft' ? 'مسودة' : 'مجدول'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => markAsPosted(idea.id)}
                    >
                      نُشر
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteIdea(idea.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            لا توجد أفكار محتوى بعد
          </p>
        )}
      </CardContent>
    </Card>
  );
}
