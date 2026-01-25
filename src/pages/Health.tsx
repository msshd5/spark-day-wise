import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowRight,
  Moon,
  Sun,
  Utensils,
  TrendingUp,
  Calendar,
  Check,
  X,
} from 'lucide-react';
import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';

interface FastingRecord {
  date: string;
  fasted: boolean;
}

interface SleepRecord {
  date: string;
  hours: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

export default function Health() {
  const { user } = useAuth();
  const [fastingRecords, setFastingRecords] = useState<FastingRecord[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [sleepHours, setSleepHours] = useState('7');
  const [sleepQuality, setSleepQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayFasted = fastingRecords.find(r => r.date === today)?.fasted;
  const todaySleep = sleepRecords.find(r => r.date === today);

  // Load records
  useEffect(() => {
    if (user) {
      const savedFasting = localStorage.getItem(`fasting_${user.id}`);
      const savedSleep = localStorage.getItem(`sleep_${user.id}`);
      if (savedFasting) setFastingRecords(JSON.parse(savedFasting));
      if (savedSleep) setSleepRecords(JSON.parse(savedSleep));
    }
  }, [user]);

  // Save fasting
  const saveFasting = (records: FastingRecord[]) => {
    if (user) {
      localStorage.setItem(`fasting_${user.id}`, JSON.stringify(records));
      setFastingRecords(records);
    }
  };

  // Save sleep
  const saveSleep = (records: SleepRecord[]) => {
    if (user) {
      localStorage.setItem(`sleep_${user.id}`, JSON.stringify(records));
      setSleepRecords(records);
    }
  };

  // Toggle fasting for today
  const toggleFasting = (fasted: boolean) => {
    const existing = fastingRecords.filter(r => r.date !== today);
    saveFasting([...existing, { date: today, fasted }]);
    toast.success(fasted ? 'تم تسجيل الصيام ✓' : 'لم تصم اليوم');
  };

  // Log sleep
  const logSleep = () => {
    const hours = parseFloat(sleepHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      toast.error('أدخل عدد ساعات صحيح');
      return;
    }
    const existing = sleepRecords.filter(r => r.date !== today);
    saveSleep([...existing, { date: today, hours, quality: sleepQuality }]);
    toast.success('تم تسجيل النوم ✓');
  };

  // Weekly data for charts
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, 'yyyy-MM-dd');
  });

  const weeklyFastingData = last7Days.map(date => {
    const record = fastingRecords.find(r => r.date === date);
    return {
      day: format(new Date(date), 'EEE', { locale: ar }),
      date,
      fasted: record?.fasted ? 1 : 0,
    };
  });

  const weeklySleepData = last7Days.map(date => {
    const record = sleepRecords.find(r => r.date === date);
    return {
      day: format(new Date(date), 'EEE', { locale: ar }),
      date,
      hours: record?.hours || 0,
    };
  });

  // Statistics
  const weekFastingCount = weeklyFastingData.filter(d => d.fasted).length;
  const monthFastingCount = fastingRecords.filter(r => {
    const date = new Date(r.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear() &&
           r.fasted;
  }).length;

  const weekSleepAvg = weeklySleepData.reduce((sum, d) => sum + d.hours, 0) / 7;
  const sleepGoal = 7;
  const sleepProgress = Math.min((weekSleepAvg / sleepGoal) * 100, 100);

  const qualityLabels = {
    poor: 'سيء',
    fair: 'مقبول',
    good: 'جيد',
    excellent: 'ممتاز',
  };

  const qualityColors = {
    poor: 'text-destructive',
    fair: 'text-warning',
    good: 'text-success',
    excellent: 'text-primary',
  };

  const chartConfig = {
    fasted: {
      label: "صيام",
      color: "hsl(var(--primary))",
    },
    hours: {
      label: "ساعات",
      color: "hsl(var(--accent))",
    },
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">الصحة والعادات</h1>
          <p className="text-sm text-muted-foreground">تتبع الصيام والنوم</p>
        </div>
      </header>

      <Tabs defaultValue="fasting" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fasting" className="gap-2">
            <Utensils className="w-4 h-4" />
            الصيام
          </TabsTrigger>
          <TabsTrigger value="sleep" className="gap-2">
            <Moon className="w-4 h-4" />
            النوم
          </TabsTrigger>
        </TabsList>

        {/* Fasting Tab */}
        <TabsContent value="fasting" className="space-y-4">
          {/* Today's Status */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="w-4 h-4 text-warning" />
                اليوم - {format(new Date(), 'd MMMM', { locale: ar })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground mb-4">هل صمت اليوم؟</p>
              <div className="flex gap-3">
                <Button
                  variant={todayFasted === true ? 'default' : 'outline'}
                  className={cn("flex-1 gap-2", todayFasted === true && "bg-success hover:bg-success/90")}
                  onClick={() => toggleFasting(true)}
                >
                  <Check className="w-4 h-4" />
                  نعم، صائم
                </Button>
                <Button
                  variant={todayFasted === false ? 'default' : 'outline'}
                  className={cn("flex-1 gap-2", todayFasted === false && "bg-destructive hover:bg-destructive/90")}
                  onClick={() => toggleFasting(false)}
                >
                  <X className="w-4 h-4" />
                  لا
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{weekFastingCount}</p>
                <p className="text-sm text-muted-foreground">أيام هذا الأسبوع</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-accent">{monthFastingCount}</p>
                <p className="text-sm text-muted-foreground">أيام هذا الشهر</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                إحصائيات الأسبوع
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={weeklyFastingData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 1]} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => value === 1 ? 'صائم' : 'مفطر'}
                  />
                  <Bar 
                    dataKey="fasted" 
                    fill="var(--color-fasted)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
              
              {/* Week days indicator */}
              <div className="flex justify-between mt-2">
                {weeklyFastingData.map((d, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                      d.fasted ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {d.fasted ? '✓' : '○'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sleep Tab */}
        <TabsContent value="sleep" className="space-y-4">
          {/* Today's Sleep */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="w-4 h-4 text-accent" />
                نوم الليلة الماضية
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {todaySleep ? (
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-accent mb-2">{todaySleep.hours}</p>
                  <p className="text-sm text-muted-foreground mb-2">ساعات نوم</p>
                  <Badge className={qualityColors[todaySleep.quality]}>
                    {qualityLabels[todaySleep.quality]}
                  </Badge>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">عدد الساعات</label>
                      <Input
                        type="number"
                        value={sleepHours}
                        onChange={(e) => setSleepHours(e.target.value)}
                        min="0"
                        max="24"
                        step="0.5"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">جودة النوم</label>
                      <Select value={sleepQuality} onValueChange={(v: any) => setSleepQuality(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="poor">سيء</SelectItem>
                          <SelectItem value="fair">مقبول</SelectItem>
                          <SelectItem value="good">جيد</SelectItem>
                          <SelectItem value="excellent">ممتاز</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={logSleep} className="w-full btn-gradient">
                    تسجيل النوم
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sleep Goal Progress */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm">معدل النوم الأسبوعي</span>
                <span className="text-sm font-bold">{weekSleepAvg.toFixed(1)} / {sleepGoal} ساعات</span>
              </div>
              <Progress value={sleepProgress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {sleepProgress >= 100 ? '🎉 ممتاز! تحقق الهدف' : `${Math.round(sleepProgress)}% من الهدف`}
              </p>
            </CardContent>
          </Card>

          {/* Weekly Sleep Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                ساعات النوم هذا الأسبوع
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart data={weeklySleepData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 12]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone"
                    dataKey="hours" 
                    stroke="var(--color-hours)" 
                    strokeWidth={2}
                    dot={{ fill: "var(--color-hours)", r: 4 }}
                  />
                </LineChart>
              </ChartContainer>

              {/* Daily hours display */}
              <div className="grid grid-cols-7 gap-1 mt-3">
                {weeklySleepData.map((d, i) => (
                  <div key={i} className="text-center">
                    <p className={cn(
                      "text-xs font-medium",
                      d.hours >= sleepGoal ? "text-success" : d.hours > 0 ? "text-warning" : "text-muted-foreground"
                    )}>
                      {d.hours > 0 ? d.hours : '-'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sleep Quality Summary */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ملخص جودة النوم</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-4 gap-2">
                {(['excellent', 'good', 'fair', 'poor'] as const).map(quality => {
                  const count = sleepRecords.filter(r => r.quality === quality).length;
                  return (
                    <div key={quality} className="text-center p-2 rounded-lg bg-muted/50">
                      <p className={cn("text-lg font-bold", qualityColors[quality])}>
                        {count}
                      </p>
                      <p className="text-xs text-muted-foreground">{qualityLabels[quality]}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
