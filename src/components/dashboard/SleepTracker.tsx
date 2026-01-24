import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Bed, Moon, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SleepRecord {
  date: string;
  hours: number;
  quality?: 'good' | 'okay' | 'bad';
}

export function SleepTracker() {
  const { user } = useAuth();
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hours, setHours] = useState('7');
  const [quality, setQuality] = useState<'good' | 'okay' | 'bad'>('okay');

  const SLEEP_GOAL = 7; // ساعات النوم المثالية

  // Load from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`sleep_${user.id}`);
      if (saved) {
        setSleepRecords(JSON.parse(saved));
      }
    }
  }, [user]);

  // Save to localStorage
  const saveRecords = (records: SleepRecord[]) => {
    if (user) {
      localStorage.setItem(`sleep_${user.id}`, JSON.stringify(records));
      setSleepRecords(records);
    }
  };

  const addSleepRecord = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const hoursNum = parseFloat(hours);
    
    if (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 24) return;

    const updated = sleepRecords.filter(r => r.date !== today);
    updated.push({ date: today, hours: hoursNum, quality });
    saveRecords(updated);
    setDialogOpen(false);
  };

  // Get today's record
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = sleepRecords.find(r => r.date === today);

  // Get last 7 days average
  const last7Days = Array.from({ length: 7 }, (_, i) => 
    format(subDays(new Date(), i), 'yyyy-MM-dd')
  );
  const last7DaysRecords = sleepRecords.filter(r => last7Days.includes(r.date));
  const weeklyAverage = last7DaysRecords.length > 0
    ? last7DaysRecords.reduce((sum, r) => sum + r.hours, 0) / last7DaysRecords.length
    : 0;

  // Compare to last week
  const prevWeekDays = Array.from({ length: 7 }, (_, i) => 
    format(subDays(new Date(), i + 7), 'yyyy-MM-dd')
  );
  const prevWeekRecords = sleepRecords.filter(r => prevWeekDays.includes(r.date));
  const prevWeekAverage = prevWeekRecords.length > 0
    ? prevWeekRecords.reduce((sum, r) => sum + r.hours, 0) / prevWeekRecords.length
    : 0;

  const trend = weeklyAverage - prevWeekAverage;

  const qualityLabels = {
    good: 'ممتاز 😊',
    okay: 'عادي 😐',
    bad: 'سيء 😴',
  };

  const qualityColors = {
    good: 'bg-success/20 text-success',
    okay: 'bg-warning/20 text-warning',
    bad: 'bg-destructive/20 text-destructive',
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bed className="w-4 h-4 text-blue-500" />
            تتبع النوم
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs">
              <DialogHeader>
                <DialogTitle>تسجيل النوم</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    كم ساعة نمت؟
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setHours(Math.max(0, parseFloat(hours) - 0.5).toString())}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="text-center text-lg font-bold"
                      dir="ltr"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setHours(Math.min(24, parseFloat(hours) + 0.5).toString())}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    ساعة
                  </p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    جودة النوم
                  </label>
                  <div className="flex gap-2">
                    {(['good', 'okay', 'bad'] as const).map((q) => (
                      <Button
                        key={q}
                        variant={quality === q ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setQuality(q)}
                        className="flex-1"
                      >
                        {qualityLabels[q]}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button onClick={addSleepRecord} className="w-full btn-gradient">
                  حفظ
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Today's sleep */}
        {todayRecord ? (
          <div className="p-3 rounded-lg bg-muted/50 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نوم الليلة الماضية</p>
                <p className="text-2xl font-bold">{todayRecord.hours} ساعة</p>
              </div>
              {todayRecord.quality && (
                <Badge className={qualityColors[todayRecord.quality]}>
                  {qualityLabels[todayRecord.quality]}
                </Badge>
              )}
            </div>
            <Progress 
              value={(todayRecord.hours / SLEEP_GOAL) * 100} 
              className="h-2 mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              من هدف {SLEEP_GOAL} ساعات
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-muted/30 text-center mb-3">
            <Moon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">لم تسجل نومك اليوم</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-3 h-3 ml-1" />
              سجّل الآن
            </Button>
          </div>
        )}

        {/* Weekly stats */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">معدل الأسبوع</p>
            <p className="font-bold">{weeklyAverage.toFixed(1)} ساعة</p>
          </div>
          {prevWeekRecords.length > 0 && (
            <div className={cn(
              "flex items-center gap-1 text-sm",
              trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : trend < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              <span>{Math.abs(trend).toFixed(1)}+ ساعة</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
