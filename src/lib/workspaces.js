import { isSupabaseConfigured, supabase } from './supabase.js';

export const DEFAULT_WORKSPACE_NAME = 'Personal Workspace';

export async function ensureUserWorkspace(user) {
  if (!isSupabaseConfigured || !supabase || !user?.id) {
    return null;
  }

  await upsertProfile(user);

  const existingWorkspace = await loadFirstWorkspace(user.id);
  if (existingWorkspace) return existingWorkspace;

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      owner_user_id: user.id,
      name: DEFAULT_WORKSPACE_NAME,
    })
    .select('id,name,owner_user_id')
    .single();

  if (workspaceError) throw workspaceError;

  const { error: memberError } = await supabase
    .from('workspace_members')
    .upsert(
      {
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
      },
      { onConflict: 'workspace_id,user_id' },
    );

  if (memberError) throw memberError;
  return workspace;
}

async function upsertProfile(user) {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email || '',
      display_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    },
    { onConflict: 'id' },
  );

  if (error) throw error;
}

async function loadFirstWorkspace(userId) {
  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id,role')
    .eq('user_id', userId)
    .limit(1);

  if (membershipError) throw membershipError;
  const workspaceId = memberships?.[0]?.workspace_id;
  if (!workspaceId) return null;

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id,name,owner_user_id')
    .eq('id', workspaceId)
    .maybeSingle();

  if (workspaceError) throw workspaceError;
  return workspace;
}
