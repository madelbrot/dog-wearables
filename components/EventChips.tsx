import { View, Text, Pressable } from 'react-native';

const PRESETS = ['Car', 'Park', 'Toy', 'Play', 'New Person', 'Dog Seen', 'Relaxing'] as const;

export function EventChips({ onPick }: { onPick: (name: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {PRESETS.map((p) => (
        <Pressable key={p} onPress={() => onPick(p)} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#eef', borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
          <Text>{p}</Text>
        </Pressable>
      ))}
    </View>
  );
}
