import { useEffect, useState } from 'react';
import { Text, ScrollView } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis } from 'victory-native';
import { fetchHRDB } from '../lib/data';
import { getDogId } from '../lib/prefs';

export default function HRDetail() {
  const [hr, setHr] = useState<any[]>([]);
  useEffect(() => { (async () => {
    const dog = await getDogId();
    if (dog) setHr(await fetchHRDB(dog));
  })(); }, []);

  const min = hr.length ? Math.min(...hr.map((p: any) => p.bpm)) : undefined;
  const max = hr.length ? Math.max(...hr.map((p: any) => p.bpm)) : undefined;

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Heart Rate — Last 24h</Text>
      <VictoryChart>
        <VictoryLine data={hr} x="ts" y="bpm" />
        <VictoryAxis dependentAxis />
      </VictoryChart>
      <Text style={{ marginTop: 12 }}>Min: {min ?? '-'} bpm  ·  Max: {max ?? '-'} bpm</Text>
      <Text style={{ color: '#555', marginTop: 8 }}>Tip: switch to a chart with tooltips for exact values.</Text>
    </ScrollView>
  );
}
