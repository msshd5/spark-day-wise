import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface WaterIntake {
  id: string;
  user_id: string;
  intake_date: string;
  amount_ml: number;
  goal_ml: number;
  created_at: string;
}

export function useWaterIntake() {
  const { user } = useAuth();
  const [intakes, setIntakes] = useState<WaterIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayTotal, setTodayTotal] = useState(0);
  const [goal, setGoal] = useState(2000);

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchIntakes = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', user.id)
      .eq('intake_date', today)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching water intake:', error);
    } else {
      const intakesData = data as WaterIntake[];
      setIntakes(intakesData);
      const total = intakesData.reduce((sum, i) => sum + i.amount_ml, 0);
      setTodayTotal(total);
      if (intakesData.length > 0) {
        setGoal(intakesData[0].goal_ml);
      }
    }
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    fetchIntakes();
  }, [fetchIntakes]);

  const addWater = async (amount: number = 250) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('water_intake')
      .insert({
        user_id: user.id,
        intake_date: today,
        amount_ml: amount,
        goal_ml: goal,
      })
      .select()
      .single();

    if (error) {
      toast.error('خطأ في تسجيل شرب الماء');
      return { error };
    }

    setIntakes(prev => [data as WaterIntake, ...prev]);
    setTodayTotal(prev => prev + amount);
    
    const newTotal = todayTotal + amount;
    if (newTotal >= goal && todayTotal < goal) {
      toast.success('🎉 أحسنت! حققت هدفك اليومي');
    } else {
      toast.success(`تم إضافة ${amount} مل`);
    }
    
    return { data, error: null };
  };

  const removeLastIntake = async () => {
    if (!user || intakes.length === 0) return;

    const lastIntake = intakes[0];
    const { error } = await supabase
      .from('water_intake')
      .delete()
      .eq('id', lastIntake.id);

    if (error) {
      toast.error('خطأ في الحذف');
      return { error };
    }

    setIntakes(prev => prev.slice(1));
    setTodayTotal(prev => prev - lastIntake.amount_ml);
    toast.success('تم إزالة آخر كوب');
    return { error: null };
  };

  const updateGoal = async (newGoal: number) => {
    setGoal(newGoal);
    toast.success(`تم تحديث الهدف إلى ${newGoal} مل`);
  };

  const percentage = Math.min(100, Math.round((todayTotal / goal) * 100));
  const cupsCount = Math.floor(todayTotal / 250);

  return {
    intakes,
    loading,
    todayTotal,
    goal,
    percentage,
    cupsCount,
    addWater,
    removeLastIntake,
    updateGoal,
    refetch: fetchIntakes,
  };
}
