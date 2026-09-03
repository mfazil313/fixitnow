import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (data?.user) {
      const user = data.user;
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let userRole = profile?.role || user.user_metadata?.role || 'customer';

      if (!profile) {
        // Create initial profile for OAuth user
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        await supabase.from('profiles').insert({
          id: user.id,
          full_name: fullName,
          email: user.email,
          role: userRole,
        });
      }

      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Default redirect based on role
      const redirectPath = userRole === 'worker' ? '/worker-dashboard' : '/upload';
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}${next ?? '/'}`);
}

