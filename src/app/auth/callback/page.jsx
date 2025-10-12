'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const [msg, setMsg] = useState('Finishing sign-in…');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Magic-link sends tokens in the URL hash: #access_token=...&refresh_token=...
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : '';
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (!access_token || !refresh_token) {
          setMsg('Sign-in error: missing tokens in callback URL.');
          return;
        }

        // Persist the session in supabase auth
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          setMsg(`Sign-in error: ${error.message}`);
          return;
        }

        setMsg('Signed in! Redirecting…');
        router.replace('/'); // later: /map
      } catch (e) {
        setMsg(`Sign-in error: ${(e && e.message) || String(e)}`);
      }
    })();
  }, [router]);

  return <main className="p-6">{msg}</main>;
}