import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Plus, Clock, Calendar, Pencil, Trash2, BookMarked, FileText, Timer } from 'lucide-react';
import { format, formatDistanceToNow, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type BookStatus = 'want_to_read' | 'reading' | 'completed' | 'completed_multiple' | 'want_to_reread';

const bookStatusLabels: Record<BookStatus, string> = {
  want_to_read: 'أنوي قراءته',
  reading: 'قيد القراءة',
  completed: 'مقروء',
  completed_multiple: 'مقروء لأكثر من مرة',
  want_to_reread: 'أريد إعادة قراءته',
};

const bookStatusColors: Record<BookStatus, string> = {
  want_to_read: 'bg-gray-500',
  reading: 'bg-blue-500',
  completed: 'bg-green-500',
  completed_multiple: 'bg-purple-500',
  want_to_reread: 'bg-amber-500',
};

interface Book {
  id: string;
  title: string;
  author: string | null;
  status: BookStatus;
  last_read_at: string | null;
  notes: string | null;
  created_at: string;
}

export default function Reading() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [lastReadSession, setLastReadSession] = useState<string | null>(null);
  const [monthlySessions, setMonthlySessions] = useState<{ session_date: string; pages_read: number | null; duration_minutes: number | null }[]>([]);
  const [sessionBook, setSessionBook] = useState<Book | null>(null);
  const [sessionPages, setSessionPages] = useState('');
  const [sessionDuration, setSessionDuration] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>('want_to_read');

  useEffect(() => {
    if (user) {
      fetchBooks();
      fetchLastReadSession();
      fetchMonthlySessions();
    }
  }, [user]);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setBooks(data as Book[]);
    }
    setLoading(false);
  };

  const fetchLastReadSession = async () => {
    const { data } = await supabase
      .from('reading_sessions')
      .select('created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setLastReadSession(data.created_at);
    }
  };

  const fetchMonthlySessions = async () => {
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    
    const { data } = await supabase
      .from('reading_sessions')
      .select('session_date, pages_read, duration_minutes')
      .eq('user_id', user!.id)
      .gte('session_date', monthStart)
      .lte('session_date', monthEnd)
      .order('session_date');

    if (data) {
      setMonthlySessions(data);
    }
  };

  const monthlyStats = useMemo(() => {
    const totalPages = monthlySessions.reduce((s, r) => s + (r.pages_read || 0), 0);
    const totalMinutes = monthlySessions.reduce((s, r) => s + (r.duration_minutes || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const sessionCount = monthlySessions.length;

    // Group by date for chart
    const byDate: Record<string, { pages: number; minutes: number }> = {};
    monthlySessions.forEach(s => {
      if (!byDate[s.session_date]) byDate[s.session_date] = { pages: 0, minutes: 0 };
      byDate[s.session_date].pages += s.pages_read || 0;
      byDate[s.session_date].minutes += s.duration_minutes || 0;
    });

    const chartData = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        label: format(new Date(date + 'T00:00:00'), 'd', { locale: ar }),
        pages: vals.pages,
        hours: Math.round((vals.minutes / 60) * 10) / 10,
      }));

    return { totalPages, totalHours, sessionCount, chartData };
  }, [monthlySessions]);

  const handleAddBook = async () => {
    if (!title.trim()) return;

    const { error } = await supabase.from('books').insert({
      user_id: user!.id,
      title: title.trim(),
      author: author.trim() || null,
      status,
    });

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في إضافة الكتاب', variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: 'تمت إضافة الكتاب بنجاح' });
      resetForm();
      setShowAddDialog(false);
      fetchBooks();
    }
  };

  const handleUpdateBook = async () => {
    if (!editingBook || !title.trim()) return;

    const { error } = await supabase
      .from('books')
      .update({
        title: title.trim(),
        author: author.trim() || null,
        status,
      })
      .eq('id', editingBook.id);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في تحديث الكتاب', variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: 'تم تحديث الكتاب بنجاح' });
      resetForm();
      setEditingBook(null);
      fetchBooks();
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    const { error } = await supabase.from('books').delete().eq('id', bookId);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في حذف الكتاب', variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: 'تم حذف الكتاب' });
      fetchBooks();
    }
  };

  const handleLogReading = async () => {
    if (!sessionBook) return;

    const { error } = await supabase.from('reading_sessions').insert({
      user_id: user!.id,
      book_id: sessionBook.id,
      pages_read: sessionPages ? parseInt(sessionPages) : null,
      duration_minutes: sessionDuration ? parseInt(sessionDuration) : null,
    });

    if (!error) {
      await supabase
        .from('books')
        .update({ last_read_at: new Date().toISOString() })
        .eq('id', sessionBook.id);

      toast({ title: 'تم', description: `تم تسجيل جلسة قراءة لـ "${sessionBook.title}"` });
      setSessionBook(null);
      setSessionPages('');
      setSessionDuration('');
      fetchBooks();
      fetchLastReadSession();
      fetchMonthlySessions();
    }
  };

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setStatus('want_to_read');
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author || '');
    setStatus(book.status);
  };

  const readingBooks = books.filter(b => b.status === 'reading');
  const completedBooks = books.filter(b => b.status === 'completed' || b.status === 'completed_multiple');
  const plannedBooks = books.filter(b => b.status === 'want_to_read' || b.status === 'want_to_reread');

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-primary" />
          القراءة
        </h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="btn-gradient" onClick={resetForm}>
              <Plus className="w-4 h-4 ml-1" />
              إضافة كتاب
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة كتاب جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>عنوان الكتاب *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="أدخل عنوان الكتاب"
                />
              </div>
              <div>
                <Label>المؤلف</Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="اسم المؤلف (اختياري)"
                />
              </div>
              <div>
                <Label>الحالة</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as BookStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(bookStatusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddBook} className="w-full btn-gradient">
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* آخر جلسة قراءة */}
      <Card className="glass-card">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">آخر جلسة قراءة</p>
                <p className="font-medium">
                  {lastReadSession
                    ? formatDistanceToNow(new Date(lastReadSession), { addSuffix: true, locale: ar })
                    : 'لم تقرأ بعد'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card text-center p-4">
          <p className="text-2xl font-bold text-blue-500">{readingBooks.length}</p>
          <p className="text-xs text-muted-foreground">قيد القراءة</p>
        </Card>
        <Card className="glass-card text-center p-4">
          <p className="text-2xl font-bold text-green-500">{completedBooks.length}</p>
          <p className="text-xs text-muted-foreground">مكتمل</p>
        </Card>
        <Card className="glass-card text-center p-4">
          <p className="text-2xl font-bold text-amber-500">{plannedBooks.length}</p>
          <p className="text-xs text-muted-foreground">مخطط</p>
        </Card>
      </div>

      {/* إحصائيات شهرية */}
      <Card className="glass-card">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              إحصائيات {format(new Date(), 'MMMM', { locale: ar })}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-muted/50">
              <FileText className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{monthlyStats.totalPages}</p>
              <p className="text-xs text-muted-foreground">صفحة</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/50">
              <Timer className="w-4 h-4 mx-auto mb-1 text-accent" />
              <p className="text-lg font-bold">{monthlyStats.totalHours}</p>
              <p className="text-xs text-muted-foreground">ساعة</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/50">
              <BookOpen className="w-4 h-4 mx-auto mb-1 text-success" />
              <p className="text-lg font-bold">{monthlyStats.sessionCount}</p>
              <p className="text-xs text-muted-foreground">جلسة</p>
            </div>
          </div>

          {monthlyStats.chartData.length > 0 && (
            <div className="h-44 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats.chartData} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                      direction: 'rtl',
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [
                      value, 
                      name === 'pages' ? 'صفحات' : 'ساعات'
                    ]}
                    labelFormatter={(label) => `يوم ${label}`}
                  />
                  <Bar dataKey="pages" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="pages" />
                  <Bar dataKey="hours" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* قائمة الكتب */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
      ) : books.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <BookMarked className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">لا توجد كتب بعد</p>
            <p className="text-sm text-muted-foreground">أضف كتابك الأول للبدء</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {books.map((book) => (
            <Card key={book.id} className="glass-card">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{book.title}</h3>
                      <Badge className={`${bookStatusColors[book.status]} text-white text-xs`}>
                        {bookStatusLabels[book.status]}
                      </Badge>
                    </div>
                    {book.author && (
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                    )}
                    {book.last_read_at && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        آخر قراءة: {formatDistanceToNow(new Date(book.last_read_at), { addSuffix: true, locale: ar })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSessionBook(book)}
                      title="تسجيل جلسة قراءة"
                    >
                      <BookOpen className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(book)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteBook(book.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog تعديل الكتاب */}
      <Dialog open={!!editingBook} onOpenChange={() => setEditingBook(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الكتاب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>عنوان الكتاب *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="أدخل عنوان الكتاب" />
            </div>
            <div>
              <Label>المؤلف</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="اسم المؤلف (اختياري)" />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BookStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(bookStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateBook} className="w-full btn-gradient">حفظ التغييرات</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog تسجيل جلسة قراءة */}
      <Dialog open={!!sessionBook} onOpenChange={() => { setSessionBook(null); setSessionPages(''); setSessionDuration(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل جلسة قراءة - {sessionBook?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>عدد الصفحات (اختياري)</Label>
              <Input
                type="number"
                value={sessionPages}
                onChange={(e) => setSessionPages(e.target.value)}
                placeholder="مثال: 30"
                min="1"
              />
            </div>
            <div>
              <Label>مدة القراءة بالدقائق (اختياري)</Label>
              <Input
                type="number"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(e.target.value)}
                placeholder="مثال: 45"
                min="1"
              />
            </div>
            <Button onClick={handleLogReading} className="w-full btn-gradient">
              تسجيل الجلسة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
