'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function EmailLogin() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);

  async function sendMagicLink() {
    setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: process.env.NEXT_PUBLIC_REDIRECT_URL }
    });
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div className="max-w-sm space-y-3">
      <label className="block text-sm">Email</label>
      <input
        className="w-full border rounded px-3 py-2"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <button
        className="w-full rounded bg-black text-white py-2"
        onClick={sendMagicLink}
        disabled={!email || sent}
      >
        {sent ? 'Magic link sent ✅' : 'Send magic link'}
      </button>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <p className="text-xs text-gray-500">Check spam/promotions if you don’t see it.</p>
    </div>
  );
}