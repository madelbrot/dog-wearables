import { useLocalSearchParams, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function InsightDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const title =
    slug === 'car' ? '🚗 Likely car ride' :
    slug === 'other-dog' ? '🐕 Saw another dog' :
    slug === 'stress' ? '⚠️ Possible stress' :
    `Insight: ${slug}`;

  return (
    <View style={{ flex: 1, padding: 20, gap: 10 }}>
      <Stack.Screen options={{ title }} />
      <Text style={{ fontSize: 20, fontWeight: '600' }}>{title}</Text>
      <Text>
        Placeholder details. Show time window, related HR/bark snippets,
        and trainer tips here.
      </Text>
    </View>
  );
}
