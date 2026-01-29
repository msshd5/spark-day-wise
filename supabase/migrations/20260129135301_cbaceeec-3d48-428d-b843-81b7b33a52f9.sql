
-- جدول الكتب
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'want_to_read',
  notes TEXT,
  last_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول جلسات القراءة
CREATE TABLE public.reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  pages_read INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول العادات
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📌',
  color TEXT DEFAULT '#8B5CF6',
  frequency TEXT NOT NULL DEFAULT 'daily',
  target_count INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول تتبع العادات اليومي
CREATE TABLE public.habit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_count INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, log_date)
);

-- تفعيل RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- سياسات الكتب
CREATE POLICY "Users can view their own books" ON public.books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own books" ON public.books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own books" ON public.books FOR DELETE USING (auth.uid() = user_id);

-- سياسات جلسات القراءة
CREATE POLICY "Users can view their own reading sessions" ON public.reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reading sessions" ON public.reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reading sessions" ON public.reading_sessions FOR DELETE USING (auth.uid() = user_id);

-- سياسات العادات
CREATE POLICY "Users can view their own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- سياسات تتبع العادات
CREATE POLICY "Users can view their own habit logs" ON public.habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own habit logs" ON public.habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habit logs" ON public.habit_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habit logs" ON public.habit_logs FOR DELETE USING (auth.uid() = user_id);

-- Triggers للتحديث التلقائي
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
