// src/app/login/page.jsx
import EmailLogin from '@/components/EmailLogin';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Sign in</h1>

        {/* optional link back to home */}
        <Link href="/" className="inline-block border px-4 py-2 rounded">
          ← Home
        </Link>

        <EmailLogin />
      </div>
    </main>
  );
}