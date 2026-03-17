// أنواع قاعدة البيانات

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'postponed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 'work' | 'learning' | 'health' | 'personal' | 'other';
export type ProjectStatus = 'active' | 'completed' | 'paused' | 'archived';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type MoodType = 'great' | 'good' | 'okay' | 'bad';
export type CommitmentType = 'work' | 'part_time' | 'study' | 'other';

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  work_start_time: string;
  work_end_time: string;
  work_days: string[];
  part_time_days: string[] | null;
  part_time_start_time: string | null;
  part_time_end_time: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  collaborators: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  estimated_duration: number | null;
  due_date: string | null;
  completed_at: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  parent_task_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  project?: Project;
  subtasks?: Task[];
}

export interface Commitment {
  id: string;
  user_id: string;
  title: string;
  type: CommitmentType;
  days: string[];
  start_time: string;
  end_time: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyPlan {
  id: string;
  user_id: string;
  plan_date: string;
  top_priorities: string[];
  scheduled_tasks: ScheduledTask[];
  available_minutes: number;
  energy_level: EnergyLevel;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledTask {
  task_id: string;
  start_time: string;
  end_time: string;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  goals: string[];
  task_distribution: Record<string, string[]>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyReview {
  id: string;
  user_id: string;
  review_date: string;
  accomplishments: string[];
  blockers: string[];
  tomorrow_tasks: string[];
  mood: MoodType | null;
  notes: string | null;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages?: AIMessage[];
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ترجمات الأنواع للعربية
export const taskStatusLabels: Record<TaskStatus, string> = {
  pending: 'جديد',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  postponed: 'مؤجل',
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي',
  urgent: 'عاجل',
};

export const taskCategoryLabels: Record<TaskCategory, string> = {
  work: 'عمل',
  learning: 'تعلم',
  health: 'صحة',
  personal: 'شخصي',
  other: 'أخرى',
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  active: 'نشط',
  completed: 'مكتمل',
  paused: 'متوقف',
  archived: 'مؤرشف',
};

export const energyLevelLabels: Record<EnergyLevel, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
};

export const moodLabels: Record<MoodType, string> = {
  great: 'ممتاز',
  good: 'جيد',
  okay: 'مقبول',
  bad: 'سيء',
};

export const commitmentTypeLabels: Record<CommitmentType, string> = {
  work: 'دوام',
  part_time: 'عمل جزئي',
  study: 'دراسة',
  other: 'أخرى',
};

export const dayLabels: Record<string, string> = {
  sun: 'الأحد',
  mon: 'الإثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  fri: 'الجمعة',
  sat: 'السبت',
};
