import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: existingUsers } = await supabase.auth.admin.listUsers({ filter: `email.eq.${email}` });
    const existing = existingUsers?.users?.find(u => u.email === email);

    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
      return Response.json({ uid: existing.id, existing: true });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
        const { data: users2 } = await supabase.auth.admin.listUsers();
        const found = users2?.users?.find(u => u.email === email);
        if (found) {
          await supabase.auth.admin.updateUserById(found.id, { password, email_confirm: true });
          return Response.json({ uid: found.id, existing: true });
        }
      }
      throw error;
    }

    return Response.json({ uid: data.user.id });
  } catch (error) {
    console.error('Create auth user error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
