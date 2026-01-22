-- Add weekly work schedule fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS work_days text[] NOT NULL DEFAULT ARRAY['sun','mon','tue','wed','thu'];

-- Optional future part-time schedule (nullable, user said next week)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS part_time_days text[] NULL,
ADD COLUMN IF NOT EXISTS part_time_start_time time NULL,
ADD COLUMN IF NOT EXISTS part_time_end_time time NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);