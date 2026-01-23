-- إنشاء جدول متتبع شرب الماء
CREATE TABLE public.water_intake (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intake_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL DEFAULT 250,
  goal_ml INTEGER NOT NULL DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own water intake" 
ON public.water_intake 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water intake" 
ON public.water_intake 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water intake" 
ON public.water_intake 
FOR DELETE 
USING (auth.uid() = user_id);

-- إضافة حقول السوشل ميديا للبروفايل
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS social_x TEXT,
ADD COLUMN IF NOT EXISTS social_linkedin TEXT;