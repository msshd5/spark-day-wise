import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Check, X } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FastingDay {
  date: string;
  isFasting: boolean;
}

export function FastingTracker() {
  const { user } = useAuth();
  const [fastingDays, setFastingDays] = useState<FastingDay[]>([]);
  const [todayStatus, setTodayStatus] = useState<boolean | null>(null);

  // Load from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`fasting_${user.id}`);
      if (saved) {
        const data = JSON.parse(saved) as FastingDay[];
        setFastingDays(data);
        
        // Check today's status
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayRecord = data.find(d => d.date === today);
        if (todayRecord) {
          setTodayStatus(todayRecord.isFasting);
        }
      }
    }
  }, [user]);

  // Save to localStorage
  const saveFastingDays = (days: FastingDay[]) => {
    if (user) {
      localStorage.setItem(`fasting_${user.id}`, JSON.stringify(days));
      setFastingDays(days);
    }
  };

  const setFastingStatus = (isFasting: boolean) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const updated = fastingDays.filter(d => d.date !== today);
    updated.push({ date: today, isFasting });
    saveFastingDays(updated);
    setTodayStatus(isFasting);
  };

  // Get this week's days
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  // Count fasting days this month
  const thisMonthFastingCount = fastingDays.filter(d => {
    const date = new Date(d.date);
    const now = new Date();
    return d.isFasting && 
           date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            تتبع الصيام
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {thisMonthFastingCount} يوم هذا الشهر
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Today's status */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm font-medium">اليوم</p>
            <p className="text-xs text-muted-foreground">
              {todayStatus === null 
                ? 'لم تحدد بعد' 
                : todayStatus 
                  ? 'صائم ✨' 
                  : 'مفطر'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={todayStatus === true ? 'default' : 'outline'}
              onClick={() => setFastingStatus(true)}
              className={cn(
                "gap-1",
                todayStatus === true && "bg-primary"
              )}
            >
              <Check className="w-3 h-3" />
              صائم
            </Button>
            <Button
              size="sm"
              variant={todayStatus === false ? 'secondary' : 'outline'}
              onClick={() => setFastingStatus(false)}
            >
              <X className="w-3 h-3" />
              مفطر
            </Button>
          </div>
        </div>

        {/* Week view */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const record = fastingDays.find(d => d.date === dateStr);
            const isFasting = record?.isFasting;
            
            return (
              <div
                key={dateStr}
                className={cn(
                  "flex flex-col items-center py-2 rounded-lg transition-colors",
                  isToday(day) && "bg-primary/10 ring-1 ring-primary/30",
                  isFasting && "bg-indigo-500/20"
                )}
              >
                <span className="text-xs text-muted-foreground mb-1">
                  {dayNames[index]}
                </span>
                <span className={cn(
                  "text-sm font-medium",
                  isToday(day) && "text-primary"
                )}>
                  {format(day, 'd')}
                </span>
                {isFasting !== undefined && (
                  <span className="mt-1">
                    {isFasting ? (
                      <Moon className="w-3 h-3 text-indigo-500" />
                    ) : (
                      <Sun className="w-3 h-3 text-yellow-500" />
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
