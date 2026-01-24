import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lightbulb, Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Idea {
  id: string;
  content: string;
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => deleteIdea(idea.id)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
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
