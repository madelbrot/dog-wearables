import { View, Text, ScrollView, Button, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { getDogId } from '../lib/prefs';
import { useEffect, useState } from 'react';
import { severityColor } from '../lib/severity';
import { computeCarBarkInsight, computeDogSeenHRInsight, computeNightWhineInsight, computeCarHRElevation, computePlayCalmInsight, computeStrangerStressInsight, computeRelaxInsight } from '../lib/insights';

export default function Insights() {
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    const dog = await getDogId();
    if (!dog || !supabase) return setItems([]);
    const { data } = await supabase
      .from('insights')
      .select('ts,category,summary,score')
      .eq('dog_id', dog)
      .order('ts', { ascending: false })
      .limit(20);
    setItems(data ?? []);
  };

  const recompute = async () => {
    const dog = await getDogId();
    if (!dog) return Alert.alert('No dog', 'Create a dog first');
    const results = await Promise.all([
      computeCarBarkInsight(dog),
      computeDogSeenHRInsight(dog),
      computeNightWhineInsight(dog),
      computeCarHRElevation(dog),
      computePlayCalmInsight(dog),
      computeStrangerStressInsight(dog),
      computeRelaxInsight(dog)
    ]);
    const made = results.filter((r: any) => r.created);
    if (made.length) Alert.alert('Insights updated', made.map((m:any)=>m.summary).join('\n\n'));
    else Alert.alert('No new insights');
    await load();
  };

  useEffect(() => { load(); }, []);

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>AI Insights</Text>
      <Button title="Recompute All" onPress={recompute} />
      <View style={{ height: 12 }} />
      {items.map((ins, i) => {
        const sev = severityColor(ins.score ?? 0.5);
        return (
          <View key={i} style={{ padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, borderLeftWidth: 6, borderLeftColor: sev.color }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{sev.icon} {ins.category}</Text>
            <Text style={{ color: '#444', marginTop: 6 }}>{ins.summary}</Text>
            {typeof ins.score === 'number' && <Text style={{ marginTop: 6, color: sev.color, fontWeight: '600' }}>{sev.label} (score {ins.score.toFixed(2)})</Text>}
            <Text style={{ marginTop: 6, color: '#94a3b8' }}>{new Date(ins.ts).toLocaleString()}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
