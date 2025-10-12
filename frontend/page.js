import Link from 'next/link';
import UserBadge from '@/components/UserBadge';

export default function HomePage() {
  return (
    <main style={{ padding: 20 }}>
      Home route works ✅
      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
        <Link href="/login" className="inline-block border px-3 py-2 rounded">Go to Login →</Link>
        <Link href="/survey" className="inline-block border px-3 py-2 rounded">Go to Survey →</Link>
      </div>
      <div style={{ marginTop: 16 }}>
        <UserBadge />
      </div>
    </main>
  );
}