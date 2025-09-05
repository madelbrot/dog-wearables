import { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Alert } from 'react-native';
import { EventChips } from '../components/EventChips';
import { insertUserEvent } from '../lib/data';
import { getDogId } from '../lib/prefs';

export default function LogEvent() {
  const [type, setType] = useState<string>('');
  const [note, setNote] = useState('');

  const save = async () => {
    const dog = await getDogId();
    if (!dog) { Alert.alert('No dog', 'Create a dog first'); return; }
    try {
      await insertUserEvent(dog, type, note);
      Alert.alert('Logged', `${type}${note ? ` — ${note}` : ''}`);
      setType('');
      setNote('');
    } catch (e: any) {
      Alert.alert('Save failed', e.message ?? 'Unknown error');
    }
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Log an Event</Text>
      <EventChips onPick={setType} />
      <Text style={{ marginTop: 12 }}>Selected: {type || '—'}</Text>
      <TextInput
        placeholder="Optional note"
        value={note}
        onChangeText={setNote}
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginTop: 12 }}
      />
      <View style={{ height: 12 }} />
      <Button title="Save" onPress={save} disabled={!type} />
    </ScrollView>
  );
}
