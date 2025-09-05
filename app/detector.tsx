import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { startDetector, stop, DetectorMode } from '../lib/detector';
import { flushAudioEvents } from '../lib/upload';

export default function DetectorScreen() {
  const [mode, setMode] = useState<DetectorMode>('sim');
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const timerRef = useRef<any>(null);

  const toggle = async () => {
    if (running) {
      await stop();
      setRunning(false);
    } else {
      await startDetector(mode);
      setRunning(true);
    }
  };

  useEffect(() => {
    timerRef.current = setInterval(() => setCount((c) => c + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Audio Detector</Text>
      <Text style={{ marginTop: 6, color: '#475569' }}>Mode: {mode === 'sim' ? 'Simulated' : 'Microphone (beta)'}</Text>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <Pressable onPress={() => setMode('sim')} style={{ padding: 10, backgroundColor: '#e2e8f0', borderRadius: 8 }}>
          <Text>Simulated</Text>
        </Pressable>
        <Pressable onPress={() => setMode('mic')} style={{ padding: 10, backgroundColor: '#e2e8f0', borderRadius: 8 }}>
          <Text>Mic (beta)</Text>
        </Pressable>
      </View>

      <Pressable onPress={toggle} style={{ marginTop: 16, padding: 12, backgroundColor: running ? '#fecaca' : '#bbf7d0', borderRadius: 8 }}>
        <Text style={{ fontWeight: '600' }}>{running ? 'Stop' : 'Start'}</Text>
      </Pressable>

      <Pressable onPress={() => flushAudioEvents().then(({uploaded}) => Alert.alert('Uploaded', `${uploaded} audio events`)).catch((e)=>Alert.alert('Upload failed', e.message))} style={{ marginTop: 12, padding: 12, backgroundColor: '#ddd', borderRadius: 8 }}>
        <Text>Upload Now</Text>
      </Pressable>

      <View style={{ marginTop: 16, padding: 16, backgroundColor: 'white', borderRadius: 12 }}>
        <Text style={{ fontWeight: '600' }}>Demo status</Text>
        <Text style={{ marginTop: 6 }}>Timer ticks: {count}</Text>
        <Text style={{ marginTop: 2, color: '#64748b' }}>Events are generated and queued in the background while running.</Text>
      </View>

      <Text style={{ marginTop: 16, color: '#64748b' }}>
        Note: Mic metering support varies by platform; if unavailable, detector falls back to simulated mode.
      </Text>
    </View>
  );
}
