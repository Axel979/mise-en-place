import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqjkxmrhalrlbfackydv.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamt4bXJoYWxybGJmYWNreWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzUwMjIsImV4cCI6MjA4OTkxMTAyMn0.3lR3Bvo9pFX1PvBF6XlXGiqEixC_l_G5gocX4MIETv0'
);

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) await loadProfile(session.user.id);
        else { setProfile(null); setLoading(false); }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
    } else {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: userId, username: null, xp: 0, level: 1 })
        .select()
        .single();
      setProfile(newProfile);
    }
    setLoading(false);
  };

const saveXp = async (userId: string, xp: number) => {
  console.log('Saving XP:', userId, xp);
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ 
      id: userId, 
      xp: xp,
      updated_at: new Date().toISOString() 
    }, { 
      onConflict: 'id' 
    })
    .select();
  console.log('saveXp result:', data, error);
};

  const logCompletedRecipe = async (userId: string, recipe: any) => {
    const { error } = await supabase
      .from('completed_recipes')
      .insert({
        user_id: userId,
        recipe_id: recipe.id,
        cooked_at: new Date().toISOString(),
        rating: recipe.rating || null,
        notes: recipe.notes || null,
      });
    if (error) console.error('logCompletedRecipe error:', error);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return { user, profile, loading, saveXp, logCompletedRecipe, signOut, supabase };
}
