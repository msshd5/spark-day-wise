import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Commitment, CommitmentType } from '@/types/database';
import { toast } from 'sonner';

export function useCommitments() {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommitments = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('start_time');

    if (error) {
      console.error('Error fetching commitments:', error);
      toast.error('خطأ في جلب الالتزامات');
    } else {
      setCommitments(data as Commitment[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCommitments();
  }, [fetchCommitments]);

  const addCommitment = async (commitment: Omit<Commitment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('لم يتم تسجيل الدخول') };

    const insertData = {
      title: commitment.title,
      type: commitment.type,
      days: commitment.days,
      start_time: commitment.start_time,
      end_time: commitment.end_time,
      color: commitment.color,
      is_active: commitment.is_active,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('commitments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast.error('خطأ في إضافة الالتزام');
      return { error };
    }

    setCommitments(prev => [...prev, data as Commitment]);
    toast.success('تم إضافة الالتزام');
    return { data, error: null };
  };

  const updateCommitment = async (id: string, updates: Partial<Commitment>) => {
    const { error } = await supabase
      .from('commitments')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('خطأ في تحديث الالتزام');
      return { error };
    }

    setCommitments(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    toast.success('تم تحديث الالتزام');
    return { error: null };
  };

  const deleteCommitment = async (id: string) => {
    const { error } = await supabase
      .from('commitments')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('خطأ في حذف الالتزام');
      return { error };
    }

    setCommitments(prev => prev.filter(c => c.id !== id));
    toast.success('تم حذف الالتزام');
    return { error: null };
  };

  // الحصول على التزامات يوم معين
  const getCommitmentsForDay = useCallback((dayCode: string): Commitment[] => {
    return commitments.filter(c => c.days.includes(dayCode));
  }, [commitments]);

  // التحقق من وجود تعارض
  const hasConflict = useCallback((
    startTime: string,
    endTime: string,
    days: string[],
    excludeId?: string
  ): boolean => {
    return commitments.some(c => {
      if (excludeId && c.id === excludeId) return false;
      
      const hasCommonDay = c.days.some(d => days.includes(d));
      if (!hasCommonDay) return false;

      // التحقق من تداخل الأوقات
      const start1 = startTime;
      const end1 = endTime;
      const start2 = c.start_time;
      const end2 = c.end_time;

      return start1 < end2 && end1 > start2;
    });
  }, [commitments]);

  return {
    commitments,
    loading,
    addCommitment,
    updateCommitment,
    deleteCommitment,
    getCommitmentsForDay,
    hasConflict,
    refetch: fetchCommitments,
  };
}
