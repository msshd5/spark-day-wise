import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Calendar,
  Trash2,
  ArrowRight,
  Filter,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

export default function ContentHub() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'x' | 'linkedin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'scheduled' | 'posted'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMonth] = useState(new Date());
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

  // Filtered ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      const matchesSearch = idea.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = filterPlatform === 'all' || idea.platform === filterPlatform;
      const matchesStatus = filterStatus === 'all' || idea.status === filterStatus;
      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [ideas, searchQuery, filterPlatform, filterStatus]);

  // Calendar data
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const scheduledIdeas = ideas.filter(i => i.scheduledDate && i.status !== 'posted');

  const getIdeasForDay = (day: Date) => {
    return scheduledIdeas.filter(idea =>
      idea.scheduledDate && isSameDay(new Date(idea.scheduledDate), day)
    );
  };

  const weekDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

  const statusLabels = {
    draft: 'مسودة',
    scheduled: 'مجدول',
    posted: 'نُشر',
  };

  const statusColors = {
    draft: 'bg-muted text-muted-foreground',
    scheduled: 'bg-primary/20 text-primary',
    posted: 'bg-success/20 text-success',
  };

  // Stats
  const stats = {
    total: ideas.length,
    drafts: ideas.filter(i => i.status === 'draft').length,
    scheduled: ideas.filter(i => i.status === 'scheduled').length,
    posted: ideas.filter(i => i.status === 'posted').length,
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">مركز المحتوى</h1>
            <p className="text-sm text-muted-foreground">إدارة محتوى X و LinkedIn</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="w-4 h-4 ml-2" />
              جديد
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
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">الكل</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.drafts}</p>
            <p className="text-xs text-muted-foreground">مسودة</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.scheduled}</p>
            <p className="text-xs text-muted-foreground">مجدول</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-success">{stats.posted}</p>
            <p className="text-xs text-muted-foreground">نُشر</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="gap-2">
            <FileText className="w-4 h-4" />
            القائمة
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />
            التقويم
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Search & Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في المحتوى..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={filterPlatform === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterPlatform('all')}
              >
                الكل
              </Badge>
              <Badge
                variant={filterPlatform === 'x' ? 'default' : 'outline'}
                className="cursor-pointer gap-1"
                onClick={() => setFilterPlatform('x')}
              >
                <XIcon className="w-3 h-3" />
                X
              </Badge>
              <Badge
                variant={filterPlatform === 'linkedin' ? 'default' : 'outline'}
                className="cursor-pointer gap-1"
                onClick={() => setFilterPlatform('linkedin')}
              >
                <LinkedInIcon className="w-3 h-3" />
                LinkedIn
              </Badge>
              <span className="mx-2 text-border">|</span>
              <Badge
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterStatus('all')}
              >
                الكل
              </Badge>
              <Badge
                variant={filterStatus === 'draft' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterStatus('draft')}
              >
                مسودة
              </Badge>
              <Badge
                variant={filterStatus === 'scheduled' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterStatus('scheduled')}
              >
                مجدول
              </Badge>
              <Badge
                variant={filterStatus === 'posted' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterStatus('posted')}
              >
                نُشر
              </Badge>
            </div>
          </div>

          {/* Content List */}
          {filteredIdeas.length > 0 ? (
            <div className="space-y-3">
              {filteredIdeas.map((idea) => (
                <Card key={idea.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted shrink-0">
                        {idea.platform === 'x' ? (
                          <XIcon className="w-4 h-4" />
                        ) : (
                          <LinkedInIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm mb-2">{idea.content}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={statusColors[idea.status]}>
                            {statusLabels[idea.status]}
                          </Badge>
                          {idea.scheduledDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(idea.scheduledDate), 'd MMM yyyy', { locale: ar })}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(idea.createdAt), 'd MMM', { locale: ar })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border/50">
                      {idea.status !== 'posted' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsPosted(idea.id)}
                        >
                          <CheckCircle className="w-3 h-3 ml-1" />
                          نُشر
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteIdea(idea.id)}
                      >
                        <Trash2 className="w-3 h-3 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterPlatform !== 'all' || filterStatus !== 'all'
                    ? 'لا توجد نتائج'
                    : 'لا يوجد محتوى بعد'}
                </p>
                <Button onClick={() => setDialogOpen(true)} className="btn-gradient">
                  <Plus className="w-4 h-4 ml-2" />
                  أضف أول فكرة
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">تقويم المحتوى</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {format(currentMonth, 'MMMM yyyy', { locale: ar })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {/* Week days */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Month days */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {monthDays.map(day => {
                  const dayIdeas = getIdeasForDay(day);
                  const hasContent = dayIdeas.length > 0;

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative",
                        isToday(day) && "bg-primary/20 text-primary font-bold",
                        hasContent && !isToday(day) && "bg-accent/10"
                      )}
                    >
                      <span>{format(day, 'd')}</span>
                      {hasContent && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayIdeas.slice(0, 2).map((idea, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                idea.platform === 'x' ? 'bg-foreground' : 'bg-blue-600'
                              )}
                            />
                          ))}
                          {dayIdeas.length > 2 && (
                            <span className="text-[8px] text-muted-foreground">+{dayIdeas.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Upcoming posts */}
              {scheduledIdeas.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">المنشورات القادمة</p>
                  {scheduledIdeas.slice(0, 5).map(idea => (
                    <div key={idea.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
                      {idea.platform === 'x' ? (
                        <XIcon className="w-3 h-3 shrink-0" />
                      ) : (
                        <LinkedInIcon className="w-3 h-3 shrink-0" />
                      )}
                      <span className="truncate flex-1">{idea.content}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {format(new Date(idea.scheduledDate!), 'd MMM', { locale: ar })}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
