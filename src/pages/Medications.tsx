import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Pill, Plus, Trash2, Clock, Check, X, Loader2, Edit2, Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Medication {
  id: string;
  user_id: string;
  title: string;
  dosage: string | null;
  frequency: string;
  times: string[];
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
  color: string;
  created_at: string;
}

interface MedicationLog {
  id: string;
  medication_id: string;
  log_date: string;
  taken_at: string;
}

const frequencyLabels: Record<string, string> = {
  daily: 'يومياً',
  weekly: 'أسبوعياً',
  as_needed: 'عند الحاجة',
};

const defaultColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Medications() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    dosage: '',
    frequency: 'daily',
    times: ['08:00'],
    notes: '',
    color: '#10b981',
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      fetchMedications();
      fetchTodayLogs();
    }
  }, [user]);

  const fetchMedications = async () => {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('created_at');

    if (error) {
      console.error('Error fetching medications:', error);
    } else {
      setMedications((data || []) as Medication[]);
    }
    setLoading(false);
  };

  const fetchTodayLogs = async () => {
    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', user!.id)
      .eq('log_date', today);

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      setLogs((data || []) as MedicationLog[]);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      dosage: '',
      frequency: 'daily',
      times: ['08:00'],
      notes: '',
      color: '#10b981',
    });
    setEditingMed(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('أدخل اسم الدواء');
      return;
    }

    const payload = {
      user_id: user!.id,
      title: form.title.trim(),
      dosage: form.dosage || null,
      frequency: form.frequency,
      times: form.times.filter(t => t),
      notes: form.notes || null,
      color: form.color,
    };

    if (editingMed) {
      const { error } = await supabase
        .from('medications')
        .update(payload)
        .eq('id', editingMed.id);

      if (error) {
        toast.error('خطأ في تحديث الدواء');
        return;
      }
      toast.success('تم تحديث الدواء');
    } else {
      const { error } = await supabase
        .from('medications')
        .insert(payload);

      if (error) {
        toast.error('خطأ في إضافة الدواء');
        return;
      }
      toast.success('تم إضافة الدواء');
    }

    setDialogOpen(false);
    resetForm();
    fetchMedications();
  };

  const handleEdit = (med: Medication) => {
    setEditingMed(med);
    setForm({
      title: med.title,
      dosage: med.dosage || '',
      frequency: med.frequency,
      times: med.times.length > 0 ? med.times : ['08:00'],
      notes: med.notes || '',
      color: med.color,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('medications')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast.error('خطأ في حذف الدواء');
      return;
    }
    toast.success('تم حذف الدواء');
    fetchMedications();
  };

  const markAsTaken = async (medicationId: string) => {
    const existingLog = logs.find(l => l.medication_id === medicationId);
    
    if (existingLog) {
      // Remove log
      const { error } = await supabase
        .from('medication_logs')
        .delete()
        .eq('id', existingLog.id);

      if (error) {
        toast.error('خطأ في التحديث');
        return;
      }
      setLogs(prev => prev.filter(l => l.id !== existingLog.id));
    } else {
      // Add log
      const { data, error } = await supabase
        .from('medication_logs')
        .insert({
          user_id: user!.id,
          medication_id: medicationId,
          log_date: today,
        })
        .select()
        .single();

      if (error) {
        toast.error('خطأ في التسجيل');
        return;
      }
      setLogs(prev => [...prev, data as MedicationLog]);
      toast.success('تم تسجيل تناول الدواء ✓');
    }
  };

  const isTaken = (medicationId: string) => logs.some(l => l.medication_id === medicationId);

  const addTimeSlot = () => {
    setForm(prev => ({ ...prev, times: [...prev.times, '12:00'] }));
  };

  const removeTimeSlot = (index: number) => {
    setForm(prev => ({ ...prev, times: prev.times.filter((_, i) => i !== index) }));
  };

  const updateTime = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      times: prev.times.map((t, i) => i === index ? value : t),
    }));
  };

  const takenCount = medications.filter(m => isTaken(m.id)).length;
  const progress = medications.length > 0 ? Math.round((takenCount / medications.length) * 100) : 0;

  return (
    <div className="min-h-screen p-4 pb-24">
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          <Pill className="w-6 h-6 text-primary" />
          الأدوية
        </h1>
        <p className="text-muted-foreground text-sm">تتبع أدويتك اليومية</p>
      </header>

      {/* Today's Progress */}
      {medications.length > 0 && (
        <Card className="glass-card mb-6 overflow-hidden animate-fade-in">
          <div 
            className="h-1.5 transition-all duration-500"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(to left, hsl(var(--primary)), hsl(var(--accent)))'
            }}
          />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">أدوية اليوم</p>
                <p className="text-lg font-bold">{takenCount} من {medications.length}</p>
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold text-primary">{progress}%</p>
                <p className="text-xs text-muted-foreground">مكتمل</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : medications.length === 0 ? (
        <Card className="glass-card animate-fade-in">
          <CardContent className="p-8 text-center">
            <Pill className="w-12 h-12 text-primary/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">لا توجد أدوية مسجلة</p>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="btn-gradient">
                  <Plus className="w-4 h-4 ml-2" />
                  أضف دواء
                </Button>
              </DialogTrigger>
              <MedicationDialog 
                form={form} 
                setForm={setForm} 
                onSave={handleSave}
                editing={!!editingMed}
                addTimeSlot={addTimeSlot}
                removeTimeSlot={removeTimeSlot}
                updateTime={updateTime}
              />
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {medications.map((med) => {
            const taken = isTaken(med.id);
            return (
              <Card 
                key={med.id} 
                className={cn(
                  "glass-card transition-all",
                  taken && "opacity-70"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => markAsTaken(med.id)}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                        taken 
                          ? "bg-primary text-primary-foreground" 
                          : "border-2 border-dashed border-muted-foreground/30"
                      )}
                      style={{ backgroundColor: taken ? med.color : undefined }}
                    >
                      {taken ? <Check className="w-5 h-5" /> : null}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "font-bold",
                        taken && "line-through text-muted-foreground"
                      )}>
                        {med.title}
                      </h3>
                      
                      {med.dosage && (
                        <p className="text-sm text-muted-foreground">{med.dosage}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {frequencyLabels[med.frequency] || med.frequency}
                        </Badge>
                        {med.times.map((time, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <Clock className="w-3 h-3 ml-1" />
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(med)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(med.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Button */}
      {medications.length > 0 && (
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-gradient fixed bottom-24 left-4 shadow-lg">
              <Plus className="w-5 h-5 ml-2" />
              أضف دواء
            </Button>
          </DialogTrigger>
          <MedicationDialog 
            form={form} 
            setForm={setForm} 
            onSave={handleSave}
            editing={!!editingMed}
            addTimeSlot={addTimeSlot}
            removeTimeSlot={removeTimeSlot}
            updateTime={updateTime}
          />
        </Dialog>
      )}
    </div>
  );
}

function MedicationDialog({
  form,
  setForm,
  onSave,
  editing,
  addTimeSlot,
  removeTimeSlot,
  updateTime,
}: {
  form: any;
  setForm: any;
  onSave: () => void;
  editing: boolean;
  addTimeSlot: () => void;
  removeTimeSlot: (i: number) => void;
  updateTime: (i: number, v: string) => void;
}) {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{editing ? 'تعديل الدواء' : 'إضافة دواء جديد'}</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 mt-4">
        <div>
          <Label>اسم الدواء *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
            placeholder="مثال: فيتامين د"
            className="mt-1"
          />
        </div>

        <div>
          <Label>الجرعة</Label>
          <Input
            value={form.dosage}
            onChange={(e) => setForm((p: any) => ({ ...p, dosage: e.target.value }))}
            placeholder="مثال: حبة واحدة"
            className="mt-1"
          />
        </div>

        <div>
          <Label>التكرار</Label>
          <Select value={form.frequency} onValueChange={(v) => setForm((p: any) => ({ ...p, frequency: v }))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">يومياً</SelectItem>
              <SelectItem value="weekly">أسبوعياً</SelectItem>
              <SelectItem value="as_needed">عند الحاجة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>أوقات التناول</Label>
            <Button variant="ghost" size="sm" onClick={addTimeSlot}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {form.times.map((time: string, i: number) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => updateTime(i, e.target.value)}
                  className="flex-1"
                />
                {form.times.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeTimeSlot(i)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>اللون</Label>
          <div className="flex gap-2 mt-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setForm((p: any) => ({ ...p, color: c }))}
                className={cn(
                  "w-8 h-8 rounded-full transition-all",
                  form.color === c && "ring-2 ring-offset-2 ring-primary"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label>ملاحظات</Label>
          <Input
            value={form.notes}
            onChange={(e) => setForm((p: any) => ({ ...p, notes: e.target.value }))}
            placeholder="ملاحظات إضافية..."
            className="mt-1"
          />
        </div>

        <Button onClick={onSave} className="w-full btn-gradient">
          {editing ? 'حفظ التعديلات' : 'إضافة الدواء'}
        </Button>
      </div>
    </DialogContent>
  );
}
