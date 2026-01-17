import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  User, 
  Clock, 
  Bell, 
  LogOut,
  ChevronLeft,
  Loader2,
  Save,
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [workStartTime, setWorkStartTime] = useState(profile?.work_start_time || '09:00');
  const [workEndTime, setWorkEndTime] = useState(profile?.work_end_time || '17:00');

  const handleSave = async () => {
    setLoading(true);
    const { error } = await updateProfile({
      name: name.trim() || null,
      work_start_time: workStartTime,
      work_end_time: workEndTime,
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
              أوقات العمل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">بداية العمل</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={workStartTime}
                  onChange={(e) => setWorkStartTime(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">نهاية العمل</Label>
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
