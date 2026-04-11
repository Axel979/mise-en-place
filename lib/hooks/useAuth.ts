import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqjkxmrhalrlbfackydv.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamt4bXJoYWxybGJmYWNreWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzUwMjIsImV4cCI6MjA4OTkxMTAyMn0.3lR3Bvo9pFX1PvBF6XlXGiqEixC_l_G5gocX4MIETv0'
);

export function useAuth() {
  const [user, setUser]       = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Store userId in ref so async callbacks always have the latest value
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      userIdRef.current = u?.id ?? null;
      if (u) loadProfile(u.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        userIdRef.current = u?.id ?? null;
        if (u) await loadProfile(u.id);
        else { setProfile(null); setLoading(false); }
      }
    );

    // Safety net: force loading=false after 3s so the app never hangs on a blank screen.
    const timeout = setTimeout(() => setLoading(false), 3000);

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
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
    } catch (e) {
      console.error('loadProfile error:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── XP ────────────────────────────────────────────────────
  const saveXp = async (userId: string, xp: number) => {
    try {
      await supabase
        .from('profiles')
        .upsert({ id: userId, xp, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    } catch (e) {
      console.error('saveXp error:', e);
    }
  };

  // ── Completed recipes ─────────────────────────────────────
  const logCompletedRecipe = async (userId: string, recipe: any) => {
    try {
      await supabase.from('completed_recipes').insert({
        user_id: userId,
        recipe_id: String(recipe.id),
        cooked_at: new Date().toISOString(),
        rating: recipe.rating || null,
        notes: recipe.notes || null,
      });
    } catch (e) {
      console.error('logCompletedRecipe error:', e);
    }
  };

  const loadCompletedRecipes = async () => {
    const uid = userIdRef.current;
    if (!uid) return [];
    try {
      const { data, error } = await supabase
        .from('completed_recipes')
        .select('*')
        .eq('user_id', uid)
        .order('cooked_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('loadCompletedRecipes error:', e);
      return [];
    }
  };

  // ── Profile field savers ──────────────────────────────────
  const saveProfileField = async (userId: string, fields: Record<string, any>) => {
    if (!userId) return;
    try {
      await supabase
        .from('profiles')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (e) {
      console.error('saveProfileField error:', e);
    }
  };
  const saveEarnedBadges      = (uid: string, badges: string[])  => saveProfileField(uid, { earned_badges: badges });
  const saveChallengeProgress = (uid: string, progress: any)     => saveProfileField(uid, { challenge_progress: progress });
  const saveCookedDates       = (uid: string, dates: string[])   => saveProfileField(uid, { cooked_dates: dates });
  const saveSavedPosts        = (uid: string, postIds: string[]) => saveProfileField(uid, { saved_posts: postIds });
  const saveGoal              = (uid: string, goalId: string)    => saveProfileField(uid, { goal_id: goalId });

  // ── Activity feed ─────────────────────────────────────────
  const postActivity = async (entry: {
    type: string;
    recipe_name?: string;
    recipe_id?: string;
    caption?: string;
    photo_url?: string;
    xp_earned?: number;
    rating?: number;
  }) => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      await supabase.from('activity_feed').insert({
        user_id: uid,
        ...entry,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('postActivity error:', e);
    }
  };

  const loadFeed = async () => {
    const uid = userIdRef.current;
    if (!uid) return [];
    try {
      const { data, error } = await supabase
        .from('activity_feed')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('loadFeed error:', e);
      return [];
    }
  };

  // ── User recipes ──────────────────────────────────────────
  const loadUserRecipes = async () => {
    const uid = userIdRef.current;
    if (!uid) return [];
    try {
      const { data, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        category: r.category || 'Comfort',
        difficulty: r.difficulty || 'Medium',
        time: r.time || '30 min',
        ingredients: r.ingredients || [],
        steps: r.steps || [],
        tip: r.tip || null,
        sourceUrl: r.source_url || null,
        sourceName: r.source_name || null,
        xp: r.xp || 60,
        isPersonal: true,
        isCustom: !r.is_imported,
        isImported: r.is_imported || false,
        photo: null,
        emoji: '',
        done: false,
        diets: ['No restrictions'],
        macros: null,
        _supabaseId: r.id, // keep original uuid
      }));
    } catch (e) {
      console.error('loadUserRecipes error:', e);
      return [];
    }
  };

  const saveUserRecipe = async (recipe: any) => {
    const uid = userIdRef.current;
    if (!uid) return null;
    try {
      const { data, error } = await supabase
        .from('user_recipes')
        .insert({
          user_id: uid,
          name: recipe.name,
          category: recipe.category || 'Comfort',
          difficulty: recipe.difficulty || 'Medium',
          time: recipe.time || '30 min',
          ingredients: recipe.ingredients || [],
          steps: recipe.steps || [],
          tip: recipe.tip || null,
          source_url: recipe.sourceUrl || null,
          source_name: recipe.sourceName || null,
          xp: recipe.xp || 60,
          is_imported: recipe.isImported || false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('saveUserRecipe error:', e);
      return null;
    }
  };

  const updateUserRecipe = async (supabaseId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('user_recipes')
        .update({
          name: updates.name,
          category: updates.category,
          difficulty: updates.difficulty,
          time: updates.time,
          ingredients: updates.ingredients,
          steps: updates.steps,
          tip: updates.tip,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supabaseId);
      if (error) throw error;
    } catch (e) {
      console.error('updateUserRecipe error:', e);
    }
  };

  const deleteUserRecipe = async (supabaseId: string) => {
    try {
      const { error } = await supabase
        .from('user_recipes')
        .delete()
        .eq('id', supabaseId);
      if (error) throw error;
    } catch (e) {
      console.error('deleteUserRecipe error:', e);
    }
  };

  // ── Friends ───────────────────────────────────────────────
  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) return [];
    const uid = userIdRef.current;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, xp')
        .ilike('username', `%${query}%`)
        .neq('id', uid || '')
        .limit(10);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('searchUsers error:', e);
      return [];
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    const uid = userIdRef.current;
    if (!uid || uid === friendId) return { error: 'invalid' };
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({ user_id: uid, friend_id: friendId, status: 'pending' });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('sendFriendRequest error:', e);
      return { error: e.message };
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      await supabase.from('friendships').delete().eq('id', friendshipId);
    } catch (e) {
      console.error('removeFriend error:', e);
    }
  };

  const loadFriends = async () => {
    const uid = userIdRef.current;
    if (!uid) return { friends: [], pending: [], requests: [] };
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id, status, user_id, friend_id,
          sender:user_id (id, username, avatar_url, xp),
          receiver:friend_id (id, username, avatar_url, xp)
        `)
        .or(`user_id.eq.${uid},friend_id.eq.${uid}`);
      if (error) throw error;
      const rows = data || [];
      const friends = rows
        .filter((r: any) => r.status === 'accepted')
        .map((r: any) => ({
          friendshipId: r.id,
          ...(r.user_id === uid ? r.receiver : r.sender),
        }));
      const pending = rows
        .filter((r: any) => r.status === 'pending' && r.user_id === uid)
        .map((r: any) => ({ friendshipId: r.id, ...r.receiver }));
      const requests = rows
        .filter((r: any) => r.status === 'pending' && r.friend_id === uid)
        .map((r: any) => ({ friendshipId: r.id, ...r.sender }));
      return { friends, pending, requests };
    } catch (e) {
      console.error('loadFriends error:', e);
      return { friends: [], pending: [], requests: [] };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return {
    user, profile, loading, supabase,
    saveXp, logCompletedRecipe, loadCompletedRecipes,
    saveEarnedBadges, saveChallengeProgress, saveCookedDates, saveSavedPosts, saveGoal,
    postActivity, loadFeed,
    loadUserRecipes, saveUserRecipe, updateUserRecipe, deleteUserRecipe,
    searchUsers, sendFriendRequest, acceptFriendRequest, removeFriend, loadFriends,
    signOut,
  };
}
