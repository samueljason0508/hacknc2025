'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SurveyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    city: '',
    hasCar: 'no',
    maxWalkMin: 20,
    commute: 3,
    errands: 3,
    parking: 3,
    noisePollution: 3,
    populationDensity: 3,
    rentRatio: 3,
    transitWait: 3,
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        const w = data.weights || {};
        setForm({
          city: data.city || '',
          hasCar: data.has_car || 'no',
          maxWalkMin: data.max_walk_min || 20,
          commute: Number(w.commute ?? 3),
          errands: Number(w.errands ?? 3),
          parking: Number(w.parking ?? 3),
          noisePollution: Number(w.noisePollution ?? 3),
          populationDensity: Number(w.populationDensity ?? 3),
          rentRatio: Number(w.rentRatio ?? 3),
          transitWait: Number(w.transitWait ?? 3),
        });
      }
    })();
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSaved(false);
    setError(null);

    const payload = {
      user_id: user.id,
      city: form.city,
      has_car: form.hasCar,
      max_walk_min: form.maxWalkMin,
      weights: {
        commute: form.commute,
        errands: form.errands,
        parking: form.parking,
        noisePollution: form.noisePollution,
        populationDensity: form.populationDensity,
        rentRatio: form.rentRatio,
        transitWait: form.transitWait,
      },
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' });

    setSaving(false);
    if (error) setError(error.message);
    else setSaved(true);
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="space-y-4 w-full max-w-md">
        <h1 className="text-2xl font-semibold">Quick survey</h1>

        <label className="block">
          <span className="text-sm">City</span>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.city}
            onChange={e => setField('city', e.target.value)}
            placeholder="e.g., Raleigh, NC"
          />
        </label>

        <label className="block">
          <span className="text-sm">Do you have a car?</span>
          <select
            className="w-full border rounded px-3 py-2"
            value={form.hasCar}
            onChange={e => setField('hasCar', e.target.value)}
          >
            <option value="no">No</option>
            <option value="sometimes">Sometimes</option>
            <option value="yes">Yes</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm">Max walking time (minutes)</span>
          <input
            type="number"
            min="5"
            max="60"
            step="5"
            className="w-full border rounded px-3 py-2"
            value={form.maxWalkMin}
            onChange={e => setField('maxWalkMin', Number(e.target.value))}
          />
        </label>

        {/* Frustration sliders */}
        <div className="space-y-3">
          {[
            ['commute', 'Commute importance'],
            ['errands', 'Errands importance'],
            ['parking', 'Parking difficulty'],
            ['noisePollution', 'Noise pollution level'],
            ['populationDensity', 'Population density'],
            ['rentRatio', 'Rent burden (median rent ÷ median income)'],
            ['transitWait', 'Transit wait time'],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-sm">{label}: {form[key]}</span>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={form[key]}
                onChange={e => setField(key, Number(e.target.value))}
                className="w-full accent-black"
              />
            </label>
          ))}
        </div>

        <button
          className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        {saved && <p className="text-green-600 text-sm">Saved to your profile ✅</p>}
        {error && <p className="text-red-600 text-sm">Error: {error}</p>}
      </form>
    </main>
  );
}
