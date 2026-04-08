import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useProfile() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
      setLoading(false);
    };
    load();
  }, []);

  const updateProfile = useCallback(async (updates: any) => {
    if (!userId) return;
    setProfile((p: any) => p ? { ...p, ...updates } : p);
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) console.error('updateProfile failed', error);
    } catch (e) {
      console.error('updateProfile threw', e);
    }
  }, [userId]);

  return { profile, updateProfile, loading, userId };
}