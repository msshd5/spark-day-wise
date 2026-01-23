-- Create commitments table for fixed weekly blocks (work, part-time, study)
CREATE TABLE public.commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('work', 'part_time', 'study', 'other')),
  days TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own commitments"
ON public.commitments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own commitments"
ON public.commitments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commitments"
ON public.commitments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commitments"
ON public.commitments FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_commitments_user_id ON public.commitments(user_id);
CREATE INDEX idx_commitments_type ON public.commitments(type);

-- Trigger for updated_at
CREATE TRIGGER update_commitments_updated_at
BEFORE UPDATE ON public.commitments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();