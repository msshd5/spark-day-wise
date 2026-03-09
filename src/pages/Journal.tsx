import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  BookOpen, Plus, Trash2, ChevronRight, ChevronLeft, 
  Loader2, Edit2, Calendar, Smile, Star, Save,
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  title: string | null;
  content: string;
  mood: string | null;
  highlights: string[];
  created_at: string;
  updated_at: string;
}

const moodOptions = [
  { value: 'great', label: 'ممتاز', emoji: '😄' },
  { value: 'good', label: 'جيد', emoji: '🙂' },
  { value: 'okay', label: 'عادي', emoji: '😐' },
  { value: 'bad', label: 'سيء', emoji: '😔' },
  { value: 'terrible', label: 'صعب', emoji: '😢' },
];

export default function Journal() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    content: '',
    mood: '',
    highlights: [''],
  });

  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const fetchEntry = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', dateStr)
      .maybeSingle();

    if (error) {
      console.error('Error fetching entry:', error);
    } else if (data) {
      setEntry(data as JournalEntry);
      setForm({
        title: data.title || '',
        content: data.content || '',
        mood: data.mood || '',
        highlights: (data.highlights as string[])?.length > 0 ? data.highlights : [''],
      });
      setIsEditing(false);
    } else {
      setEntry(null);
      setForm({ title: '', content: '', mood: '', highlights: [''] });
      setIsEditing(true);
    }
    setLoading(false);
  }, [user, dateStr]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.content.trim()) {
      toast.error('اكتب شيئاً في يومياتك');
      return;
    }

    setSaving(true);

    const payload = {
      user_id: user.id,
      entry_date: dateStr,
      title: form.title.trim() || null,
      content: form.content.trim(),
      mood: form.mood || null,
      highlights: form.highlights.filter(h => h.trim()),
    };

    let error;
    if (entry) {
      const result = await supabase
        .from('journal_entries')
        .update(payload)
        .eq('id', entry.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('journal_entries')
        .insert(payload);
      error = result.error;
    }

    if (error) {
      toast.error('خطأ في الحفظ');
      console.error(error);
    } else {
      toast.success('تم الحفظ ✓');
      fetchEntry();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!entry) return;
    
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entry.id);

    if (error) {
      toast.error('خطأ في الحذف');
    } else {
      toast.success('تم الحذف');
      setEntry(null);
      setForm({ title: '', content: '', mood: '', highlights: [''] });
      setIsEditing(true);
    }
  };

  const addHighlight = () => {
    setForm(prev => ({ ...prev, highlights: [...prev.highlights, ''] }));
  };

  const updateHighlight = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      highlights: prev.highlights.map((h, i) => i === index ? value : h),
    }));
  };

  const removeHighlight = (index: number) => {
    setForm(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  const navigatePrev = () => setCurrentDate(d => subDays(d, 1));
  const navigateNext = () => setCurrentDate(d => addDays(d, 1));
  const goToToday = () => setCurrentDate(new Date());

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen p-4 pb-24">
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          اليوميات
        </h1>
        <p className="text-muted-foreground text-sm">سجّل أفكارك ولحظاتك</p>
      </header>

      {/* Date Navigation */}
      <Card className="glass-card mb-4 animate-fade-in">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <p className="font-bold">{format(currentDate, 'EEEE', { locale: ar })}</p>
              <p className="text-sm text-muted-foreground">
                {format(currentDate, 'd MMMM yyyy', { locale: ar })}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={navigatePrev}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
          {!isToday && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={goToToday}
            >
              <Calendar className="w-4 h-4 ml-2" />
              العودة لليوم
            </Button>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : isEditing || !entry ? (
        /* Editor Mode */
        <div className="space-y-4 animate-fade-in">
          {/* Mood Selector */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Smile className="w-4 h-4" />
                كيف كان يومك؟
              </p>
              <div className="flex gap-2 justify-center">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setForm(p => ({ ...p, mood: mood.value }))}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                      form.mood === mood.value 
                        ? "bg-primary/20 ring-2 ring-primary" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-xs">{mood.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Title */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <Input
                value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="عنوان اليوم (اختياري)..."
                className="border-0 bg-transparent text-lg font-bold placeholder:font-normal p-0 h-auto focus-visible:ring-0"
              />
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <Textarea
                value={form.content}
                onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="اكتب ما يدور في ذهنك... ماذا حدث اليوم؟ ما الذي تشعر به؟"
                className="min-h-[200px] border-0 bg-transparent resize-none p-0 focus-visible:ring-0"
                rows={10}
              />
            </CardContent>
          </Card>

          {/* Highlights */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Star className="w-4 h-4 text-warning" />
                  أبرز لحظات اليوم
                </p>
                <Button variant="ghost" size="sm" onClick={addHighlight}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {form.highlights.map((highlight, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={highlight}
                      onChange={(e) => updateHighlight(i, e.target.value)}
                      placeholder={`لحظة ${i + 1}...`}
                      className="flex-1"
                    />
                    {form.highlights.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeHighlight(i)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            className="w-full btn-gradient"
            disabled={saving || !form.content.trim()}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 ml-2" />
                حفظ
              </>
            )}
          </Button>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-4 animate-fade-in">
          {/* Mood Display */}
          {entry.mood && (
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <span className="text-4xl">
                  {moodOptions.find(m => m.value === entry.mood)?.emoji}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {moodOptions.find(m => m.value === entry.mood)?.label}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <Card className="glass-card">
            <CardContent className="p-4">
              {entry.title && (
                <h2 className="text-xl font-bold mb-3">{entry.title}</h2>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{entry.content}</p>
            </CardContent>
          </Card>

          {/* Highlights */}
          {entry.highlights && entry.highlights.length > 0 && (
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-warning" />
                  أبرز اللحظات
                </p>
                <div className="space-y-2">
                  {entry.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-warning shrink-0" />
                      <p className="text-sm">{h}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4 ml-2" />
              تعديل
            </Button>
            <Button 
              variant="outline" 
              className="text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
