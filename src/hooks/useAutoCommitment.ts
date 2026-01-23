import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAutoCommitment() {
  const { user, profile } = useAuth();

  const createDefaultWorkCommitment = useCallback(async () => {
    if (!user) return;

    // Check if work commitment already exists
    const { data: existing } = await supabase
      .from('commitments')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'work')
      .limit(1);

    if (existing && existing.length > 0) {
      return; // Already has work commitment
    }

    // Create default work commitment (Sun-Thu, 8:00-15:00)
    const { error } = await supabase.from('commitments').insert({
      user_id: user.id,
      title: 'الدوام الرسمي',
      type: 'work',
      days: ['sun', 'mon', 'tue', 'wed', 'thu'],
      start_time: profile?.work_start_time || '08:00',
      end_time: profile?.work_end_time || '15:00',
      color: '#3b82f6',
      is_active: true,
    });

    if (error) {
      console.error('Error creating default commitment:', error);
    } else {
      console.log('Created default work commitment');
    }
  }, [user, profile]);

  useEffect(() => {
    if (user) {
      createDefaultWorkCommitment();
    }
  }, [user, createDefaultWorkCommitment]);
}
