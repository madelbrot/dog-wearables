import { useEffect, useState } from 'react';
import { Text, ScrollView, Button, Alert } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis } from 'victory-native';
import { fetchAudioDB } from '../lib/data';
import { getDogId } from '../lib/prefs';
import { enqueueAudioEvent, flushAudioEvents } from '../lib/upload';

export default function VocalDetail() {
  const [bars, setBars] = useState<any[]>([]);
  const load = async () => {
    const dog = await getDogId();
    if (!dog) return;
    const events = await fetchAudioDB(dog);
    const counts = new Map<number, number>();
    for (const e of events) {
      const h = new Date(e.ts).getHours();
      counts.set(h, (counts.get(h) || 0) + 1);
    }
    setBars(Array.from({ length: 24 }, (_, h) => ({ x: h, y: counts.get(h) || 0 })));
  };
  useEffect(() => { load(); }, []);

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Barking/Whining — Today</Text>
      <Button title="Add Test Bark" onPress={async () => {
        const dog = await getDogId();
        if (!dog) { Alert.alert('No dog', 'Create a dog first in Setup'); return; }
        await enqueueAudioEvent({ dog_id: dog, ts: new Date().toISOString(), type: 'bark', confidence: 0.9 });
        Alert.alert('Queued', 'Test bark event added to upload queue');
      }} />
      <Button title="Upload Audio Now" onPress={() =>
        flushAudioEvents().then(({uploaded}) => Alert.alert('Uploaded', `${uploaded} audio events`))
          .catch((e)=>Alert.alert('Upload failed', e.message))
      } />
      <VictoryChart>
        <VictoryBar data={bars} x="x" y="y" />
        <VictoryAxis dependentAxis />
        <VictoryAxis tickFormat={(h) => `${h}:00`} />
      </VictoryChart>
      <Text style={{ color: '#555', marginTop: 8 }}>Counts per hour.</Text>
    </ScrollView>
  );
}
