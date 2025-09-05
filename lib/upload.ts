import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, hasSupabase } from './supabase';

const KEY_QUEUE = 'hr_queue_v1';
const KEY_AUDIO_QUEUE = 'audio_queue_v1';
const BATCH_SIZE = 200;

export type HRSample = { dog_id: string; ts: string; bpm: number };
export type AudioSample = { dog_id: string; ts: string; type: 'bark' | 'whine'; confidence?: number };

export async function enqueueHR(sample: HRSample) {
  const raw = (await AsyncStorage.getItem(KEY_QUEUE)) || '[]';
  const arr: HRSample[] = JSON.parse(raw);
  arr.push(sample);
  await AsyncStorage.setItem(KEY_QUEUE, JSON.stringify(arr));
}

export async function flushHR() {
  if (!hasSupabase()) return { uploaded: 0 };
  const raw = (await AsyncStorage.getItem(KEY_QUEUE)) || '[]';
  const arr: HRSample[] = JSON.parse(raw);
  if (arr.length === 0) return { uploaded: 0 };
  const chunk = arr.splice(0, BATCH_SIZE);
  const { error } = await supabase.from('samples_hr').insert(chunk);
  if (error) throw error;
  await AsyncStorage.setItem(KEY_QUEUE, JSON.stringify(arr));
  return { uploaded: chunk.length };
}

export async function enqueueAudioEvent(ev: AudioSample) {
  const raw = (await AsyncStorage.getItem(KEY_AUDIO_QUEUE)) || '[]';
  const arr: AudioSample[] = JSON.parse(raw);
  arr.push(ev);
  await AsyncStorage.setItem(KEY_AUDIO_QUEUE, JSON.stringify(arr));
}

export async function flushAudioEvents() {
  if (!hasSupabase()) return { uploaded: 0 };
  const raw = (await AsyncStorage.getItem(KEY_AUDIO_QUEUE)) || '[]';
  const arr: AudioSample[] = JSON.parse(raw);
  if (arr.length === 0) return { uploaded: 0 };
  const chunk = arr.splice(0, BATCH_SIZE);
  const { error } = await supabase.from('events_audio').insert(chunk);
  if (error) throw error;
  await AsyncStorage.setItem(KEY_AUDIO_QUEUE, JSON.stringify(arr));
  return { uploaded: chunk.length };
}
