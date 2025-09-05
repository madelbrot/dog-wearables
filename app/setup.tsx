import { useState } from 'react';
import { Text, TextInput, Button, ScrollView, Alert } from 'react-native';
import { supabase, hasSupabase } from '../lib/supabase';
import { setDogId } from '../lib/prefs';

export default function SetupDog() {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');

  const createDog = async () => {
    try {
      if (!hasSupabase()) throw new Error('Supabase not configured');
      const { data: user } = await supabase.auth.getUser();
      const owner_id = user?.user?.id ?? null;
      const { data, error } = await supabase
        .from('dogs')
        .insert({ name, breed, owner_id })
        .select('id')
        .single();
      if (error) throw error;
      await setDogId(data.id);
      Alert.alert('Dog created', `Saved ${name}`);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create dog');
    }
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Create Dog</Text>
      <TextInput placeholder="Name" value={name} onChangeText={setName} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginBottom: 12 }} />
      <TextInput placeholder="Breed (optional)" value={breed} onChangeText={setBreed} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginBottom: 12 }} />
      <Button title="Create" onPress={createDog} disabled={!name} />
      <Text style={{ marginTop: 12, color: '#555' }}>
        Tip: If you haven’t set up auth yet, owner_id may be null; update RLS or add sign‑in to enforce ownership.
      </Text>
    </ScrollView>
  );
}
