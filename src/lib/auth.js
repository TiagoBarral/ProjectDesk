import { isSupabaseConfigured, supabase } from './supabase.js';

export async function getCurrentSession() {
  if (!isSupabaseConfigured || !supabase) {
    return { session: null, user: null };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return {
    session: data.session || null,
    user: data.session?.user || null,
  };
}

export function subscribeToAuth(callback) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session || null);
  });

  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Auth is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Auth is not configured.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
