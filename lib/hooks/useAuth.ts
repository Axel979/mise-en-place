import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').find(c => c.trim().match(/^sb-[^=]+-auth-token=/));
  if (!match) return null;
  try {
    let raw = match.split('=').slice(1).join('=');
    if (raw.startsWith('base64-')) raw = atob(raw.slice(7));
    const parsed = JSON.parse(decodeURIComponent(raw));
    return parsed?.access_token || null;
  } catch {
    return null;
  }
}

async function patchProfile(userId: string, payload: Record<string, any>): Promise<{ error: Error | null }> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqjkxmrhalrlbfackydv.supabase.co';
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const token = getAuthToken() || SUPABASE_ANON;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { error: new Error(`PATCH profiles failed ${res.status}: ${body}`) };
    }
    return { error: null };
  } catch (e: any) {
    clearTimeout(timeoutId);
    return { error: e.name === 'AbortError' ? new Error('Request timed out') : e };
  }
}

const SUPABASE_REST = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqjkxmrhalrlbfackydv.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function restHeaders() {
  const token = getAuthToken() || ANON_KEY;
  return { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` };
}

async function fetchProfileById(userId: string) {
  try {
    const res = await fetch(
      `${SUPABASE_REST}/rest/v1/profiles?id=eq.${userId}&select=id,username,avatar_url,xp,level,created_at&deleted_at=is.null`,
      { headers: { ...restHeaders(), 'Accept': 'application/vnd.pgrst.object+json' }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (e) { console.error('fetchProfileById error:', e); return null; }
}

async function fetchIsFollowing(targetUserId: string, currentUserId: string) {
  try {
    const res = await fetch(
      `${SUPABASE_REST}/rest/v1/follows?follower_id=eq.${currentUserId}&following_id=eq.${targetUserId}&select=id`,
      { headers: restHeaders(), signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.length > 0;
  } catch { return false; }
}

async function fetchFollowIds(column: string, userId: string): Promise<string[]> {
  try {
    const otherCol = column === 'following_id' ? 'follower_id' : 'following_id';
    const res = await fetch(
      `${SUPABASE_REST}/rest/v1/follows?${column}=eq.${userId}&select=${otherCol}`,
      { headers: restHeaders(), signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((r: any) => r[otherCol]).filter(Boolean);
  } catch { return []; }
}

async function fetchProfilesByIds(ids: string[]) {
  if (ids.length === 0) return [];
  try {
    const res = await fetch(
      `${SUPABASE_REST}/rest/v1/profiles?id=in.(${ids.join(',')})&select=id,username,avatar_url,xp&deleted_at=is.null`,
      { headers: restHeaders(), signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

async function fetchFollowersList(userId: string) {
  const ids = await fetchFollowIds('following_id', userId);
  return fetchProfilesByIds(ids);
}

async function fetchFollowingList(userId: string) {
  const ids = await fetchFollowIds('follower_id', userId);
  return fetchProfilesByIds(ids);
}

export { fetchProfileById, fetchIsFollowing, fetchFollowersList, fetchFollowingList };

export function useAuth() {
  const [user, setUser]       = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    // onAuthStateChange is the sole session handler — fires INITIAL_SESSION on mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        const u = s?.user ?? null;
        setUser(u);
        userIdRef.current = u?.id ?? null;
        if (u) await loadProfile(u.id);
        else { setProfile(null); setLoading(false); }
      }
    );

    // Safety net: force loading=false after 3s if INITIAL_SESSION never fires
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

  // ── Save all user data in one call ────────────────────────
  const saveAllUserData = async (userId: string, data: {
    xp?: number;
    completedRecipe?: any;
    earnedBadges?: string[];
    cookedDates?: string[];
    savedPosts?: string[];
    goalId?: string;
  }) => {
    // Build profile update
    const profileUpdates: any = { updated_at: new Date().toISOString() };
    if (data.xp !== undefined) profileUpdates.xp = data.xp;
    if (data.earnedBadges) profileUpdates.earned_badges = data.earnedBadges;
    if (data.cookedDates) profileUpdates.cooked_dates = data.cookedDates;
    if (data.savedPosts) profileUpdates.saved_posts = data.savedPosts;
    if (data.goalId) profileUpdates.goal_id = data.goalId;

    try {
      const { error } = await patchProfile(userId, profileUpdates);
      if (error) console.error('saveAllUserData profiles error:', error);
    } catch (e) {
      console.error('saveAllUserData profiles threw:', e);
    }

    // Save completed recipe separately
    if (data.completedRecipe) {
      try {
        const r = data.completedRecipe;
        const payload = {
          user_id: userId,
          recipe_id: String(r.id),
          cooked_at: new Date().toISOString(),
          name: r.name || null,
          emoji: r.emoji || null,
          category: r.category || null,
          difficulty: r.difficulty || null,
          xp_earned: r.xp || 0,
          photo_url: r.photo || null,
        };
        const { error } = await supabase.from('completed_recipes').insert(payload);
        if (error) {
          console.error('completed_recipes error:', JSON.stringify(error, null, 2));
          console.error('payload was:', JSON.stringify(payload, null, 2));
        }
      } catch (e) {
        console.error('saveAllUserData recipe threw:', e);
      }
    }
  };

  // ── Individual savers (kept for non-handleComplete uses) ──
  const updateProfileLocal = (patch: Record<string, any>) => {
    setProfile((prev: any) => prev ? { ...prev, ...patch } : prev);
  };

  const saveProfileField = async (userId: string, fields: Record<string, any>) => {
    if (!userId) return;
    // Optimistic UI: update local state first
    updateProfileLocal(fields);
    // Then persist to DB
    try {
      const { error } = await patchProfile(userId, { ...fields, updated_at: new Date().toISOString() });
      if (error) console.error('saveProfileField error:', error);
    } catch (e) {
      console.error('saveProfileField threw:', e);
    }
  };
  const saveXp                = (uid: string, xp: number)        => saveProfileField(uid, { xp });
  const saveEarnedBadges      = (uid: string, badges: string[])  => saveProfileField(uid, { earned_badges: badges });
  const saveCookedDates       = (uid: string, dates: string[])   => saveProfileField(uid, { cooked_dates: dates });
  const saveSavedPosts        = (uid: string, postIds: string[]) => saveProfileField(uid, { saved_posts: postIds });
  const saveGoal              = (uid: string, goalId: string)    => saveProfileField(uid, { goal_id: goalId });

  const logCompletedRecipe = async (userId: string, recipe: any) => {
    const payload = {
      user_id: userId,
      recipe_id: String(recipe.id),
      cooked_at: new Date().toISOString(),
      name: recipe.name || null,
      emoji: recipe.emoji || null,
      category: recipe.category || null,
      difficulty: recipe.difficulty || null,
      xp_earned: recipe.xp || 0,
      photo_url: recipe.photo || null,
    };
    try {
      const { error } = await supabase.from('completed_recipes').insert(payload);
      if (error) {
        console.error('completed_recipes error:', JSON.stringify(error, null, 2));
        console.error('payload was:', JSON.stringify(payload, null, 2));
      }
    } catch (e) {
      console.error('logCompletedRecipe threw:', e);
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

  // ── Activity feed ─────────────────────────────────────────
  // TODO: verify activity_feed FK constraints in Supabase dashboard
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
      const { error } = await supabase.from('activity_feed').insert({
        user_id: uid,
        ...entry,
        created_at: new Date().toISOString(),
      });
      if (error) {
        // Known issues: 23503 = FK violation, 42P01 = table doesn't exist — non-critical, don't crash cook flow
        if (error.code === '23503' || error.code === '42P01') return;
        console.error('activity_feed error:', error.message);
      }
    } catch { /* non-critical — activity feed failure must never block cook flow */ }
  };

  const loadFeed = async () => {
    const uid = userIdRef.current;
    if (!uid) return [];
    try {
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*, profiles:user_id(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        username: r.profiles?.username || null,
        avatar_url: r.profiles?.avatar_url || null,
      }));
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
        isPublic: r.is_public !== false,
        photo: r.photo_url || null,
        photoWidth: r.photo_width || null,
        photoHeight: r.photo_height || null,
        photoDominantColor: r.photo_dominant_color || null,
        emoji: '',
        done: false,
        diets: ['No restrictions'],
        macros: null,
        _supabaseId: r.id,
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
          is_public: recipe.isPublic !== false,
          photo_url: recipe.photo || null,
          photo_width: recipe.photoWidth || null,
          photo_height: recipe.photoHeight || null,
          photo_dominant_color: recipe.photoDominantColor || null,
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
    // Raw fetch PATCH — supabase.from().update() hangs in this env
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqjkxmrhalrlbfackydv.supabase.co';
    const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const token = getAuthToken() || SUPABASE_ANON;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/user_recipes?id=eq.${supabaseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify((() => {
          const payload: any = {
            name: updates.name,
            category: updates.category,
            difficulty: updates.difficulty,
            time: updates.time,
            ingredients: updates.ingredients,
            steps: updates.steps,
            tip: updates.tip,
            updated_at: new Date().toISOString(),
          };
          if (typeof updates.isPublic === 'boolean') {
            payload.is_public = updates.isPublic;
          }
          if (updates.photo !== undefined) {
            payload.photo_url = updates.photo || null;
            payload.photo_width = updates.photoWidth || null;
            payload.photo_height = updates.photoHeight || null;
            payload.photo_dominant_color = updates.photoDominantColor || null;
          }
          return payload;
        })()),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`PATCH user_recipes failed ${res.status}: ${body}`);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
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

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = () => {
    supabase.auth.signOut().catch(()=>{});
    if(typeof window!=='undefined') window.location.href = '/login';
  };

  const refresh = async () => {
    const { data: { session: s } } = await supabase.auth.refreshSession();
    if (s) {
      setSession(s);
      setUser(s.user);
      userIdRef.current = s.user?.id ?? null;
    }
  };

  const refreshProfile = async () => {
    const uid = userIdRef.current;
    if (uid) await loadProfile(uid);
  };

  // ── Follows system ────────────────────────────────────────
  const followUser = async (targetUserId: string) => {
    const uid = userIdRef.current;
    if (!uid || uid === targetUserId) return { error: 'invalid' };
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: uid, following_id: targetUserId });
      if (error && error.code !== '23505') throw error;
      return { success: true };
    } catch (e: any) {
      console.error('followUser error:', e);
      return { error: e.message };
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    const uid = userIdRef.current;
    if (!uid) return { error: 'no auth' };
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', uid)
        .eq('following_id', targetUserId);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('unfollowUser error:', e);
      return { error: e.message };
    }
  };

  const isFollowing = async (targetUserId: string): Promise<boolean> => {
    const uid = userIdRef.current;
    if (!uid) return false;
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', uid)
        .eq('following_id', targetUserId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    } catch {
      return false;
    }
  };

  const loadFollowing = async (userId?: string) => {
    const uid = userId || userIdRef.current;
    if (!uid) return [];
    try {
      const { data: rows, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', uid);
      if (error) throw error;
      const ids = (rows || []).map((r: any) => r.following_id).filter(Boolean);
      if (ids.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, xp')
        .in('id', ids);
      if (pErr) throw pErr;
      return profiles || [];
    } catch (e) {
      console.error('loadFollowing error:', e);
      return [];
    }
  };

  const loadFollowers = async (userId?: string) => {
    const uid = userId || userIdRef.current;
    if (!uid) return [];
    try {
      const { data: rows, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', uid);
      if (error) throw error;
      const ids = (rows || []).map((r: any) => r.follower_id).filter(Boolean);
      if (ids.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, xp')
        .in('id', ids);
      if (pErr) throw pErr;
      return profiles || [];
    } catch (e) {
      console.error('loadFollowers error:', e);
      return [];
    }
  };

  const loadProfileById = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, xp, level, created_at')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('loadProfileById error:', e);
      return null;
    }
  };

  /** @deprecated Use PhotoUpload component with target='avatar' instead. Remove in Phase 2 Commit 5. */
  const uploadAvatar = async (file: File): Promise<string | null> => {
    const uid = userIdRef.current;
    if (!uid) return null;
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${uid}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl + '?v=' + Date.now();
      const result = await patchProfile(uid, { avatar_url: publicUrl });
      if (result.error) throw result.error;
      return publicUrl;
    } catch (e) {
      console.error('uploadAvatar error:', e);
      return null;
    }
  };

  return {
    user, session, profile, loading, supabase, refreshProfile, updateProfileLocal,
    signIn, signOut, refresh,
    saveAllUserData,
    saveXp, saveProfileField, logCompletedRecipe, loadCompletedRecipes,
    saveEarnedBadges, saveCookedDates, saveSavedPosts, saveGoal,
    postActivity, loadFeed,
    loadUserRecipes, saveUserRecipe, updateUserRecipe, deleteUserRecipe,
    searchUsers, sendFriendRequest, acceptFriendRequest, removeFriend, loadFriends,
    followUser, unfollowUser, isFollowing, loadFollowing, loadFollowers, loadProfileById, uploadAvatar,
  };
}
