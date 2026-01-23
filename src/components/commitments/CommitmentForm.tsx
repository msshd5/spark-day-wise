import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Commitment, CommitmentType, commitmentTypeLabels, dayLabels } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface CommitmentFormProps {
  initialData?: Partial<Commitment>;
  onSubmit: (data: Omit<Commitment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function CommitmentForm({ initialData, onSubmit, onCancel, loading }: CommitmentFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState<CommitmentType>(initialData?.type || 'work');
  const [days, setDays] = useState<string[]>(initialData?.days || ['sun', 'mon', 'tue', 'wed', 'thu']);
  const [startTime, setStartTime] = useState(initialData?.start_time || '08:00');
  const [endTime, setEndTime] = useState(initialData?.end_time || '15:00');
  const [color, setColor] = useState(initialData?.color || '#3b82f6');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onSubmit({
      title,
      type,
      days,
      start_time: startTime,
      end_time: endTime,
      color,
      is_active: true,
    });
  };

  const toggleDay = (day: string) => {
    setDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">العنوان</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: الدوام الرسمي"
          required
          className="bg-input border-border"
        />
      </div>

      <div className="space-y-2">
        <Label>النوع</Label>
        <Select value={type} onValueChange={(v) => setType(v as CommitmentType)}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(commitmentTypeLabels) as [CommitmentType, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>الأيام</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <label
              key={day}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                days.includes(day) 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <Checkbox
                checked={days.includes(day)}
                onCheckedChange={() => toggleDay(day)}
                className="sr-only"
              />
              <span className="text-sm">{dayLabels[day]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">وقت البداية</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="bg-input border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">وقت النهاية</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="bg-input border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>اللون</Label>
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${
                color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 btn-gradient" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
