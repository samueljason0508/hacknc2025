'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function UserBadge() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!user) return <span>Not signed in</span>;

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <span>Signed in as <strong>{user.email}</strong></span>
      <button onClick={signOut} style={{ border: '1px solid #666', padding: '4px 8px', borderRadius: 6 }}>
        Sign out
      </button>
    </div>
  );
}