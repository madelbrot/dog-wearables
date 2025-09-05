import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChartCard } from '../components/ChartCard';
import { fetchHRDB, fetchAudioDB } from '../lib/data';
import { getDogId } from '../lib/prefs';

export default function Landing() {
  const [dogId, setDogId] = useState<string | null>(null);
  const [hr, setHr] = useState<any[]>([]);
  const [audioBars, setAudioBars] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!dogId) return;
    setRefreshing(true);
    const [hrPts, audioEv] = await Promise.all([
      fetchHRDB(dogId),
      fetchAudioDB(dogId),
    ]);
    setHr(hrPts);
    const counts = new Map<number, number>();
    for (const e of audioEv) {
      const h = new Date(e.ts).getHours();
      counts.set(h, (counts.get(h) || 0) + 1);
    }
    setAudioBars(Array.from({ length: 24 }, (_, h) => ({ x: h, y: counts.get(h) || 0 })));
    setRefreshing(false);
  };

  useEffect(() => { getDogId().then(setDogId); }, []);
  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [dogId]);

  if (!dogId) {
    return (
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ padding: 16, backgroundColor: '#f1f5f9', borderRadius: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700' }}>No dog set up yet</Text>
          <Text style={{ marginTop: 6, color: '#475569' }}>Create your first dog to start collecting data and insights.</Text>
          <Pressable onPress={() => router.push('/setup')} style={{ marginTop: 12 }}>
            <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Go to Setup →</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.push('/detector')} style={{ marginTop: 12 }}>
          <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Audio Detector (Demo) →</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Today</Text>
      <ChartCard title="Heart Rate (24h)" data={hr} variant="line" onPress={() => router.push('/hr')} />
      <ChartCard title="Vocalizations per Hour" data={audioBars} variant="bar" onPress={() => router.push('/vocal')} />
      <View style={{ height: 12 }} />
      <Text onPress={() => router.push('/log')} style={{ color: '#4f46e5', fontWeight: '600' }}>＋ Log an event</Text>
      <View style={{ height: 8 }} />
      <Text onPress={() => router.push('/insights')} style={{ color: '#4f46e5', fontWeight: '600' }}>AI Insights →</Text>
      <View style={{ height: 8 }} />
      <Text onPress={() => router.push('/ble')} style={{ color: '#4f46e5', fontWeight: '600' }}>BLE Scanner →</Text>
      <View style={{ height: 8 }} />
      <Text onPress={() => router.push('/detector')} style={{ color: '#4f46e5', fontWeight: '600' }}>Audio Detector (Demo) →</Text>
    </ScrollView>
  );
}
