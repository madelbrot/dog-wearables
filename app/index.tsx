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

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { useRouter } from 'expo-router';

const barkData = [
  { time: '08:00', barks: 3 },
  { time: '10:00', barks: 6 },
  { time: '12:00', barks: 1 },
  { time: '14:00', barks: 4 },
  { time: '16:00', barks: 8 },
  { time: '18:00', barks: 2 },
  { time: '20:00', barks: 5 },
];

const hrData = [
  { time: '08:00', hr: 75 },
  { time: '10:00', hr: 120 }, // spike → car ride
  { time: '12:00', hr: 80 },
  { time: '14:00', hr: 110 }, // spike → saw another dog
  { time: '16:00', hr: 90 },
  { time: '18:00', hr: 70 },
  { time: '20:00', hr: 85 },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
        DogWearable Insights
      </Text>

      {/* Bark graph */}
      <Text style={{ fontSize: 18, marginBottom: 5 }}>Barks today</Text>
      <LineChart
        width={350}
        height={200}
        data={barkData}
        style={{ marginBottom: 20 }}
      >
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="barks" stroke="#ff6b6b" />
      </LineChart>

      {/* Heart rate graph */}
      <Text style={{ fontSize: 18, marginBottom: 5 }}>Heart rate today</Text>
      <AreaChart
        width={350}
        height={200}
        data={hrData}
        style={{ marginBottom: 20 }}
      >
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="hr" stroke="#4dabf7" fill="#74c0fc" />
      </AreaChart>

      {/* Example clickable insights */}
      <Text style={{ fontSize: 20, fontWeight: '600', marginTop: 10, marginBottom: 10 }}>
        Insights
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/insights/car')}
        style={{ padding: 12, marginBottom: 8, backgroundColor: '#ffe066', borderRadius: 10 }}
      >
        <Text>🚗 Spike in HR around 10:00 → likely car ride</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push('/insights/other-dog')}
        style={{ padding: 12, marginBottom: 8, backgroundColor: '#fab005', borderRadius: 10 }}
      >
        <Text>🐕 HR + barking around 14:00 → saw another dog</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push('/insights/stress')}
        style={{ padding: 12, marginBottom: 8, backgroundColor: '#ffa8a8', borderRadius: 10 }}
      >
        <Text>⚠️ Period of elevated HR with whining → possible stress</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

