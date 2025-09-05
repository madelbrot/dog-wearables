import '../lib/shim';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerHourly } from '../tasks/registerHourly';

export default function Layout() {
  useEffect(() => { registerHourly().catch(()=>{}); }, []);
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'DogWearable' }} />
      <Stack.Screen name="hr" options={{ title: 'Heart Rate' }} />
      <Stack.Screen name="vocal" options={{ title: 'Vocalizations' }} />
      <Stack.Screen name="log" options={{ title: 'Log Event' }} />
      <Stack.Screen name="insights" options={{ title: 'Insights' }} />
      <Stack.Screen name="ble" options={{ title: 'BLE Scanner' }} />
      <Stack.Screen name="setup" options={{ title: 'Setup Dog' }} />
      <Stack.Screen name="detector" options={{ title: 'Audio Detector' }} />
    </Stack>
  );
}
