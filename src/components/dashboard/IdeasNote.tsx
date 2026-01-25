import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Lightbulb, Plus, X, Trash2, MoreVertical, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

// X icon
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

interface Idea {
  id: string;
  content: string;
  createdAt: string;
}

interface ContentIdea {
  id: string;
  platform: 'x' | 'linkedin';
  content: string;
  scheduledDate?: string;
  status: 'draft' | 'scheduled' | 'posted';
  createdAt: string;
}

export function IdeasNote() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load ideas from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`ideas_${user.id}`);
      if (saved) {
        setIdeas(JSON.parse(saved));
      }
    }
  }, [user]);

  // Save ideas to localStorage
  const saveIdeas = (newIdeas: Idea[]) => {
    if (user) {
      localStorage.setItem(`ideas_${user.id}`, JSON.stringify(newIdeas));
      setIdeas(newIdeas);
    }
  };

  const addIdea = () => {
    if (!newIdea.trim()) return;
    
    const idea: Idea = {
      id: Date.now().toString(),
      content: newIdea.trim(),
      createdAt: new Date().toISOString(),
    };
    
    saveIdeas([idea, ...ideas]);
    setNewIdea('');
    setIsAdding(false);
    toast.success('تم حفظ الفكرة');
  };

  const deleteIdea = (id: string) => {
    saveIdeas(ideas.filter(i => i.id !== id));
    toast.success('تم حذف الفكرة');
  };

  const convertToContent = (idea: Idea, platform: 'x' | 'linkedin') => {
    if (!user) return;
    
    // Get existing content ideas
    const savedContent = localStorage.getItem(`social_ideas_${user.id}`);
    const contentIdeas: ContentIdea[] = savedContent ? JSON.parse(savedContent) : [];
    
    // Create new content idea
    const newContent: ContentIdea = {
      id: Date.now().toString(),
      platform,
      content: idea.content,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    
    // Save to content ideas
    localStorage.setItem(`social_ideas_${user.id}`, JSON.stringify([newContent, ...contentIdeas]));
    
    // Remove from ideas
    saveIdeas(ideas.filter(i => i.id !== idea.id));
    
    toast.success(`تم تحويل الفكرة إلى محتوى ${platform === 'x' ? 'X' : 'LinkedIn'}`);
  };

  const convertToTask = async (idea: Idea) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: idea.content.slice(0, 100),
        description: idea.content,
        priority: 'medium',
        category: 'personal',
        status: 'pending',
      });

      if (error) throw error;
      
      // Remove from ideas
      saveIdeas(ideas.filter(i => i.id !== idea.id));
      toast.success('تم تحويل الفكرة إلى مهمة');
    } catch (error) {
      toast.error('فشل في إنشاء المهمة');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addIdea();
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            مذكرة الأفكار
          </CardTitle>
          {!isAdding && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isAdding && (
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="اكتب فكرتك..."
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              className="flex-1"
            />
            <Button size="icon" onClick={addIdea} className="shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setNewIdea('');
              }}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {ideas.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="group flex items-start gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Lightbulb className="w-3 h-3 text-yellow-500 mt-1 shrink-0" />
                <p className="text-sm flex-1 leading-relaxed">{idea.content}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => convertToContent(idea, 'x')}>
                      <XIcon className="w-3 h-3 ml-2" />
                      تحويل لـ X
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => convertToContent(idea, 'linkedin')}>
                      <LinkedInIcon className="w-3 h-3 ml-2" />
                      تحويل لـ LinkedIn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => convertToTask(idea)}>
                      <CheckSquare className="w-3 h-3 ml-2" />
                      تحويل لمهمة
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteIdea(idea.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-3 h-3 ml-2" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            سجّل أفكارك هنا 💡
          </p>
        )}
      </CardContent>
    </Card>
  );
}
