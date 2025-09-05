import { Pressable, Text } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryBar } from 'victory-native';

export function ChartCard({ title, onPress, data, variant = 'line' }: any) {
  return (
    <Pressable onPress={onPress} style={{ padding: 16, backgroundColor: 'white', borderRadius: 16, marginBottom: 12, elevation: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>{title}</Text>
      <VictoryChart>
        {variant === 'line' ? (
          <VictoryLine data={data} x="ts" y="bpm" />
        ) : (
          <VictoryBar data={data} x="x" y="y" />
        )}
        <VictoryAxis dependentAxis tickFormat={(t) => `${t}`} />
      </VictoryChart>
    </Pressable>
  );
}
