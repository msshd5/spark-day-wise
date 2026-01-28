-- جدول المصروفات المتكررة
CREATE TABLE public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  frequency TEXT NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- سياسات المصروفات المتكررة
CREATE POLICY "Users can view their own recurring expenses" ON public.recurring_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own recurring expenses" ON public.recurring_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring expenses" ON public.recurring_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring expenses" ON public.recurring_expenses FOR DELETE USING (auth.uid() = user_id);

-- تريجر للتحديث التلقائي
CREATE TRIGGER update_recurring_expenses_updated_at
BEFORE UPDATE ON public.recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();