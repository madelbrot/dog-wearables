import { supabase, hasSupabase } from './supabase';

export type HRPoint = { ts: number; bpm: number };
export type AudioEvent = { ts: number; type: 'bark' | 'whine'; confidence?: number };

// ---- Mock data for fallback ----
let baseTs = Date.now() - 24 * 3600 * 1000;
export const mockHR: HRPoint[] = Array.from({ length: 288 }, (_, i) => ({
  ts: baseTs + i * 5 * 60 * 1000,
  bpm: 60 + Math.round(15 * Math.sin(i / 6) + 10 * Math.random()),
}));

export const mockAudio: AudioEvent[] = Array.from({ length: 50 }, () => ({
  ts: baseTs + Math.random() * 24 * 3600 * 1000,
  type: Math.random() > 0.6 ? 'whine' : 'bark',
  confidence: 0.7 + Math.random() * 0.3,
}));

// ---- DB-backed fetchers ----
export async function fetchHRDB(dogId: string): Promise<HRPoint[]> {
  if (!hasSupabase()) return mockHR;
  const { data, error } = await supabase
    .from('samples_hr')
    .select('ts,bpm')
    .eq('dog_id', dogId)
    .gte('ts', new Date(Date.now() - 24*3600*1000).toISOString())
    .order('ts', { ascending: true });
  if (error || !data) return mockHR;
  return data.map((r: any) => ({ ts: new Date(r.ts).getTime(), bpm: r.bpm }));
}

export async function fetchAudioDB(dogId: string): Promise<AudioEvent[]> {
  if (!hasSupabase()) return mockAudio;
  const { data, error } = await supabase
    .from('events_audio')
    .select('ts,type,confidence')
    .eq('dog_id', dogId)
    .gte('ts', new Date(new Date().setHours(0,0,0,0)).toISOString())
    .order('ts', { ascending: true });
  if (error || !data) return mockAudio;
  return data.map((r: any) => ({ ts: new Date(r.ts).getTime(), type: r.type, confidence: r.confidence }));
}

export async function insertUserEvent(dogId: string, type: string, note?: string) {
  if (!hasSupabase()) return { ok: true, mocked: true } as const;
  const { error } = await supabase.from('user_events').insert({ dog_id: dogId, ts: new Date().toISOString(), type, note });
  if (error) throw error;
  return { ok: true } as const;
}
