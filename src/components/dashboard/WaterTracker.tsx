import { useState } from 'react';
import { useWaterIntake } from '@/hooks/useWaterIntake';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Droplets, Plus, Minus, Settings, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function WaterTracker() {
  const { todayTotal, goal, percentage, cupsCount, addWater, removeLastIntake, updateGoal } = useWaterIntake();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localGoal, setLocalGoal] = useState(goal);
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  const handleSaveSettings = () => {
    updateGoal(localGoal);
    setSettingsOpen(false);
  };

  return (
    <Card className="glass-card overflow-hidden">
      <div 
        className="h-1 transition-all duration-500"
        style={{ 
          width: `${percentage}%`,
          background: 'linear-gradient(to left, hsl(var(--primary)), hsl(var(--accent)))'
        }}
      />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <Droplets className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-sm">شرب الماء</p>
              <p className="text-xs text-muted-foreground">
                {todayTotal} / {goal} مل
              </p>
            </div>
          </div>
          
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>إعدادات شرب الماء</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <Label>الهدف اليومي: {localGoal} مل</Label>
                  <Slider
                    value={[localGoal]}
                    onValueChange={([value]) => setLocalGoal(value)}
                    min={1000}
                    max={4000}
                    step={250}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 لتر</span>
                    <span>4 لتر</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <Label>تذكيرات كل ساعة</Label>
                  </div>
                  <Switch
                    checked={remindersEnabled}
                    onCheckedChange={setRemindersEnabled}
                  />
                </div>

                <Button onClick={handleSaveSettings} className="w-full btn-gradient">
                  حفظ الإعدادات
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress bar */}
        <div className="relative mb-3">
          <Progress value={percentage} className="h-3 bg-blue-100 dark:bg-blue-900/30" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold">
            {percentage}%
          </span>
        </div>

        {/* Cups visual */}
        <div className="flex items-center justify-center gap-1 mb-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-6 h-8 rounded-b-lg border-2 transition-all duration-300",
                i < cupsCount
                  ? "bg-blue-500/80 border-blue-500"
                  : "bg-muted/30 border-muted"
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => removeLastIntake()}
          >
            <Minus className="w-4 h-4" />
          </Button>
          
          <Button
            className="h-12 px-6 btn-gradient rounded-full gap-2"
            onClick={() => addWater(250)}
          >
            <Plus className="w-5 h-5" />
            <span>كوب ماء</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => addWater(500)}
          >
            500 مل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
