import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { CommitmentsList } from '@/components/commitments/CommitmentsList';
import { dayLabels } from '@/types/database';
import { toast } from 'sonner';
import { 
  User, 
  Clock, 
  LogOut,
  ChevronLeft,
  Loader2,
  Save,
  CalendarDays,
} from 'lucide-react';

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export default function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [workStartTime, setWorkStartTime] = useState(profile?.work_start_time || '08:00');
  const [workEndTime, setWorkEndTime] = useState(profile?.work_end_time || '15:00');
  const [workDays, setWorkDays] = useState<string[]>(
    profile?.work_days || ['sun', 'mon', 'tue', 'wed', 'thu']
  );

  const handleSave = async () => {
    setLoading(true);
    const { error } = await updateProfile({
      name: name.trim() || null,
      work_start_time: workStartTime,
      work_end_time: workEndTime,
      work_days: workDays,
    });
    setLoading(false);

    if (error) {
      toast.error('حدث خطأ في حفظ الإعدادات');
      return;
    }

    toast.success('تم حفظ الإعدادات بنجاح');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    toast.success('تم تسجيل الخروج');
  };

  const toggleDay = (day: string) => {
    setWorkDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* الهيدر */}
      <header className="flex items-center gap-3 mb-6 animate-fade-in">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
      </header>

      <div className="space-y-6 animate-fade-in">
        {/* الملف الشخصي */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              الملف الشخصي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                placeholder="أدخل اسمك"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-muted border-border opacity-60"
              />
            </div>
          </CardContent>
        </Card>

        {/* أوقات العمل */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-accent" />
              أوقات الدوام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">بداية الدوام</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={workStartTime}
                  onChange={(e) => setWorkStartTime(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">نهاية الدوام</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={workEndTime}
                  onChange={(e) => setWorkEndTime(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* أيام الدوام */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="w-5 h-5 text-primary" />
              أيام الدوام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <label
                  key={day}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                    workDays.includes(day) 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <Checkbox
                    checked={workDays.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{dayLabels[day]}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* زر الحفظ */}
        <Button onClick={handleSave} className="w-full btn-gradient" disabled={loading}>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 ml-2" />
              حفظ الإعدادات
            </>
          )}
        </Button>

        <Separator className="my-6" />

        {/* الالتزامات */}
        <CommitmentsList />

        <Separator className="my-6" />

        {/* تسجيل الخروج */}
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}
