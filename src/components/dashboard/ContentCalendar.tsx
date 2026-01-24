import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ContentIdea {
  id: string;
  platform: 'x' | 'linkedin';
  content: string;
  scheduledDate?: string;
  status: 'draft' | 'scheduled' | 'posted';
  createdAt: string;
}

// X (Twitter) icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// LinkedIn icon
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function ContentCalendar() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [currentMonth] = useState(new Date());

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`social_ideas_${user.id}`);
      if (saved) {
        setIdeas(JSON.parse(saved));
      }
    }
  }, [user]);

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const scheduledIdeas = ideas.filter(i => i.scheduledDate && i.status !== 'posted');

  const getIdeasForDay = (day: Date) => {
    return scheduledIdeas.filter(idea => 
      idea.scheduledDate && isSameDay(new Date(idea.scheduledDate), day)
    );
  };

  // أيام الأسبوع
  const weekDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  
  // حساب يوم بداية الشهر
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            تقويم المحتوى
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {format(currentMonth, 'MMMM yyyy', { locale: ar })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* أيام الأسبوع */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>

        {/* أيام الشهر */}
        <div className="grid grid-cols-7 gap-1">
          {/* فراغات قبل أول يوم */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {monthDays.map(day => {
            const dayIdeas = getIdeasForDay(day);
            const hasContent = dayIdeas.length > 0;
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative",
                  isToday(day) && "bg-primary/20 text-primary font-bold",
                  hasContent && !isToday(day) && "bg-accent/10"
                )}
              >
                <span>{format(day, 'd')}</span>
                {hasContent && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayIdeas.slice(0, 2).map((idea, idx) => (
                      <div key={idx} className="w-1.5 h-1.5 rounded-full bg-primary" />
                    ))}
                    {dayIdeas.length > 2 && (
                      <span className="text-[8px] text-muted-foreground">+{dayIdeas.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* قائمة المنشورات القادمة */}
        {scheduledIdeas.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">المنشورات القادمة</p>
            {scheduledIdeas.slice(0, 3).map(idea => (
              <div key={idea.id} className="flex items-center gap-2 text-sm">
                {idea.platform === 'x' ? (
                  <XIcon className="w-3 h-3 shrink-0" />
                ) : (
                  <LinkedInIcon className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate flex-1">{idea.content}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {format(new Date(idea.scheduledDate!), 'd MMM', { locale: ar })}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
