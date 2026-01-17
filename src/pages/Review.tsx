import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MoodType, moodLabels } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  ChevronLeft,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const moodOptions: { value: MoodType; icon: React.ElementType; color: string }[] = [
  { value: 'great', icon: ThumbsUp, color: 'text-success bg-success/20' },
  { value: 'good', icon: Smile, color: 'text-primary bg-primary/20' },
  { value: 'okay', icon: Meh, color: 'text-warning bg-warning/20' },
  { value: 'bad', icon: Frown, color: 'text-destructive bg-destructive/20' },
];

export default function Review() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [mood, setMood] = useState<MoodType | null>(null);
  const [accomplishments, setAccomplishments] = useState('');
  const [blockers, setBlockers] = useState('');
  const [tomorrowTasks, setTomorrowTasks] = useState('');

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    
    const reviewDate = format(new Date(), 'yyyy-MM-dd');
    
    const { error } = await supabase.from('daily_reviews').upsert({
      user_id: user.id,
      review_date: reviewDate,
      mood,
      accomplishments: accomplishments.split('\n').filter(a => a.trim()),
      blockers: blockers.split('\n').filter(b => b.trim()),
      tomorrow_tasks: tomorrowTasks.split('\n').filter(t => t.trim()),
    }, {
      onConflict: 'user_id,review_date',
    });

    setLoading(false);

    if (error) {
      toast.error('حدث خطأ في حفظ المراجعة');
      return;
    }

    toast.success('تم حفظ مراجعتك اليومية! 🎉');
    navigate('/dashboard');
  };

  const todayDate = format(new Date(), 'EEEE، d MMMM', { locale: ar });

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* الهيدر */}
      <header className="flex items-center gap-3 mb-6 animate-fade-in">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">المراجعة اليومية</h1>
          <p className="text-sm text-muted-foreground">{todayDate}</p>
        </div>
      </header>

      {/* مؤشر التقدم */}
      <div className="flex gap-2 mb-8 animate-fade-in">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-all",
              s <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* الخطوات */}
      <div className="animate-fade-in">
        {/* الخطوة 1: المزاج */}
        {step === 1 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl text-center">
                كيف كان يومك؟
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-3">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMood(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all",
                      mood === option.value 
                        ? `${option.color} ring-2 ring-offset-2 ring-offset-background ring-current`
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <option.icon className="w-8 h-8" />
                    <span className="text-xs font-medium">{moodLabels[option.value]}</span>
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full btn-gradient"
                disabled={!mood}
              >
                التالي
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* الخطوة 2: الإنجازات */}
        {step === 2 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-success" />
                وش أنجزت اليوم؟
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="اكتب كل إنجاز في سطر جديد..."
                value={accomplishments}
                onChange={(e) => setAccomplishments(e.target.value)}
                className="bg-input border-border min-h-[150px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                💡 حتى الإنجازات الصغيرة مهمة!
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  السابق
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 btn-gradient">
                  التالي
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* الخطوة 3: العوائق */}
        {step === 3 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-warning" />
                وش اللي وقفك؟
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="اكتب كل عائق في سطر جديد..."
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                className="bg-input border-border min-h-[150px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                🎯 تحديد العوائق يساعدك على تجاوزها
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  السابق
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1 btn-gradient">
                  التالي
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* الخطوة 4: مهام الغد */}
        {step === 4 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                3 مهام لبكرة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="اكتب كل مهمة في سطر جديد..."
                value={tomorrowTasks}
                onChange={(e) => setTomorrowTasks(e.target.value)}
                className="bg-input border-border min-h-[150px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                ✨ ركز على 3 مهام فقط للحفاظ على التركيز
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  السابق
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1 btn-gradient"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 ml-2" />
                      إنهاء المراجعة
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
