import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Plus, ChevronLeft, MapPin } from 'lucide-react';
import { format, isToday, isTomorrow, isBefore, startOfDay, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  color: string;
  location: string | null;
}

export function UpcomingAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user!.id)
      .gte('appointment_date', today)
      .lte('appointment_date', nextWeek)
      .order('appointment_date')
      .order('start_time');

    setAppointments((data || []) as Appointment[]);
  };

  const handleAdd = async () => {
    if (!title.trim()) return;

    const { error } = await supabase.from('appointments').insert({
      user_id: user!.id,
      title: title.trim(),
      appointment_date: date,
      start_time: startTime,
      end_time: endTime || null,
      location: location.trim() || null,
    });

    if (error) {
      toast.error('خطأ في إضافة الموعد');
      return;
    }

    toast.success('تم إضافة الموعد');
    setTitle('');
    setLocation('');
    setDialogOpen(false);
    fetchAppointments();
  };

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (isToday(d)) return 'اليوم';
    if (isTomorrow(d)) return 'غداً';
    return format(d, 'EEEE', { locale: ar });
  };

  return (
    <section className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold">مواعيدك القادمة</h2>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>موعد جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>العنوان</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: موعد طبيب" />
                </div>
                <div>
                  <Label>التاريخ</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>من</Label>
                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                  </div>
                  <div>
                    <Label>إلى</Label>
                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>المكان (اختياري)</Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="مثال: مستشفى الملك فهد" />
                </div>
                <Button className="w-full btn-gradient" onClick={handleAdd}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة الموعد
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Link to="/planner">
            <Button variant="ghost" size="sm" className="text-primary text-xs">
              التقويم
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          </Link>
        </div>
      </div>

      {appointments.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">لا توجد مواعيد قادمة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {appointments.slice(0, 4).map(apt => (
            <Card key={apt.id} className="glass-card hover:border-accent/30 transition-all">
              <CardContent className="p-3 flex items-center gap-3">
                <div 
                  className="w-1 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: apt.color || 'hsl(var(--accent))' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{apt.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {apt.start_time}{apt.end_time ? ` - ${apt.end_time}` : ''}
                    </span>
                    {apt.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {apt.location}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {getDateLabel(apt.appointment_date)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
