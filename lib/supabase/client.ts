// Re-export the singleton so existing imports keep working.
import { supabase } from '@/lib/supabase';
export { supabase };
export function createClient() { return supabase; }
