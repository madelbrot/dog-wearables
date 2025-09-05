import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, Button } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { enqueueHR, flushHR, flushAudioEvents, enqueueAudioEvent } from '../lib/upload';
import { getDogId } from '../lib/prefs';

const manager = new BleManager();
const HR_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HR_CHAR    = '00002a37-0000-1000-8000-00805f9b34fb';

// Replace with your firmware's UUIDs
const AUDIO_SERVICE = '12345678-1234-5678-1234-56789abcdef0';
const AUDIO_EVENT_CHAR = '12345678-1234-5678-1234-56789abcdef1';

export default function BLEScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connected, setConnected] = useState<Device | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);

  useEffect(() => { scan(); return () => manager.stopDeviceScan(); }, []);
  useEffect(() => {
    const t = setInterval(() => { flushHR().catch(()=>{}); flushAudioEvents().catch(()=>{}); }, 15000);
    return () => clearInterval(t);
  }, []);

  const scan = () => {
    setDevices([]);
    manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) { console.warn(error); return; }
      if (!device) return;
      if (device.name?.includes('DogWearable') || device.serviceUUIDs?.includes(HR_SERVICE)) {
        setDevices((prev) => (prev.find((d) => d.id === device.id) ? prev : [...prev, device]));
      }
    });
    setTimeout(() => manager.stopDeviceScan(), 10000);
  };

  const connect = async (d: Device) => {
    try {
      const dev = await d.connect();
      await dev.discoverAllServicesAndCharacteristics();
      setConnected(dev);
      const dog = await getDogId();

      dev.monitorCharacteristicForService(HR_SERVICE, HR_CHAR, async (err, c) => {
        if (err) { console.warn(err); return; }
        if (!c?.value) return;
        const raw = Buffer.from(c.value, 'base64');
        const value = raw[1]; // naive decode; replace with proper HR profile parsing
        if (!isNaN(value)) {
          setBpm(value);
          if (dog) enqueueHR({ dog_id: dog, ts: new Date().toISOString(), bpm: value }).catch(()=>{});
        }
      });

      if (dog) {
        dev.monitorCharacteristicForService(AUDIO_SERVICE, AUDIO_EVENT_CHAR, async (err, c) => {
          if (err) { console.warn(err); return; }
          if (!c?.value) return;
          try {
            const json = Buffer.from(c.value, 'base64').toString('utf8');
            const ev = JSON.parse(json) as { type: 'bark'|'whine'; confidence?: number; ts?: number };
            await enqueueAudioEvent({
              dog_id: dog,
              ts: new Date(ev.ts ?? Date.now()).toISOString(),
              type: ev.type,
              confidence: ev.confidence ?? 0.8,
            });
          } catch (e) {
            console.warn('audio event parse failed', e);
          }
        });
      }
    } catch (e: any) {
      Alert.alert('Connect failed', e.message ?? 'Unknown error');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Nearby Devices</Text>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => connect(item)} style={{ padding: 12, backgroundColor: 'white', borderRadius: 12, marginBottom: 8 }}>
            <Text style={{ fontWeight: '600' }}>{item.name || 'Unnamed'}</Text>
            <Text style={{ color: '#555' }}>{item.id}</Text>
          </Pressable>
        )}
      />

      {connected && (
        <View style={{ marginTop: 16, padding: 16, backgroundColor: 'white', borderRadius: 12 }}>
          <Text style={{ fontWeight: '600' }}>Connected to: {connected.name || connected.id}</Text>
          <Text style={{ marginTop: 6 }}>Live BPM: {bpm ?? '—'}</Text>
          <Button title="Upload Now" onPress={() => Promise.all([flushHR(), flushAudioEvents()])
            .then(([a,b]) => Alert.alert('Uploaded', `${(a as any).uploaded} HR, ${(b as any).uploaded} audio`))
            .catch((e)=>Alert.alert('Upload failed', e.message))} />
        </View>
      )}

      <Text style={{ color: '#555', marginTop: 12 }}>
        Tip: iOS requires Bluetooth permissions; Android 12+ requires BLUETOOTH_SCAN/CONNECT and location.
      </Text>
    </View>
  );
}
