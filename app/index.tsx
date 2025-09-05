import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  VictoryChart,
  VictoryArea,
  VictoryLine,
  VictoryAxis,
  VictoryTheme,
  VictoryVoronoiContainer,
  VictoryScatter,
} from 'victory-native';

const barkData = [
  { t: 8, barks: 3 },
  { t: 10, barks: 6 },
  { t: 12, barks: 1 },
  { t: 14, barks: 4 },
  { t: 16, barks: 8 },
  { t: 18, barks: 2 },
  { t: 20, barks: 5 },
];

const hrData = [
  { t: 8, hr: 75 },
  { t: 10, hr: 120 }, // spike → car ride
  { t: 12, hr: 80 },
  { t: 14, hr: 110 }, // spike → saw another dog
  { t: 16, hr: 90 },
  { t: 18, hr: 70 },
  { t: 20, hr: 85 },
];

// “insight windows” (start hour → end hour)
const insightWindows = [
  { key: 'car', label: '🚗 Likely car ride', start: 9.5, end: 10.5, color: '#fff3bf' },
  { key: 'other-dog', label: '🐕 Saw another dog', start: 13.5, end: 14.5, color: '#ffe8cc' },
  { key: 'stress', label: '⚠️ Possible stress', start: 15.5, end: 16.5, color: '#ffe3e3' },
];

export default function HomePage() {
  const router = useRouter();

  const Axis = (
    <>
      <VictoryAxis
        tickValues={[8, 10, 12, 14, 16, 18, 20]}
        tickFormat={(h) => `${h}:00`}
        style={{ tickLabels: { fontSize: 10 } }}
      />
      <VictoryAxis
        dependentAxis
        style={{ tickLabels: { fontSize: 10 } }}
      />
    </>
  );

  const InsightBands = ({ ymin = 0, ymax = 1 }: { ymin?: number; ymax?: number }) => (
    <>
      {insightWindows.map((w) => (
        <VictoryArea
          key={`band-${w.key}`}
          data={[
            { x: w.start, y: ymax },
            { x: w.end, y: ymax },
          ]}
          style={{ data: { fill: w.color, opacity: 0.6 } }}
          interpolation="step"
        />
      ))}
    </>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>
        DogWearable Insights (sample)
      </Text>

      {/* Barks per time */}
      <Text style={{ fontSize: 18, marginBottom: 6 }}>Barks today</Text>
      <VictoryChart
        height={220}
        padding={{ top: 10, left: 45, right: 20, bottom: 40 }}
        domain={{ x: [8, 20] }}
        theme={VictoryTheme.material}
        containerComponent={
          <VictoryVoronoiContainer labels={({ datum }) => `Barks: ${datum.barks}`} />
        }
      >
        {/* Insight windows as background bands */}
        <InsightBands ymin={0} ymax={Math.max(...barkData.map(d => d.barks)) || 10} />
        {Axis}
        <VictoryLine
          data={barkData.map(({ t, barks }) => ({ x: t, y: barks }))}
        />
        <VictoryScatter
          size={3}
          data={barkData.map(({ t, barks }) => ({ x: t, y: barks }))}
        />
      </VictoryChart>

      {/* Heart rate */}
      <Text style={{ fontSize: 18, marginBottom: 6, marginTop: 8 }}>Heart rate today</Text>
      <VictoryChart
        height={220}
        padding={{ top: 10, left: 45, right: 20, bottom: 40 }}
        domain={{ x: [8, 20] }}
        theme={VictoryTheme.material}
        containerComponent={
          <VictoryVoronoiContainer labels={({ datum }) => `HR: ${datum.hr ?? datum.y} bpm`} />
        }
      >
        <InsightBands ymin={60} ymax={135} />
        {Axis}
        <VictoryArea
          data={hrData.map(({ t, hr }) => ({ x: t, y: hr }))}
          style={{ data: { opacity: 0.4 } }}
        />
        <VictoryLine
          data={hrData.map(({ t, hr }) => ({ x: t, y: hr }))}
        />
      </VictoryChart>

      {/* Insight callouts (clickable) */}
      <Text style={{ fontSize: 20, fontWeight: '600', marginTop: 12, marginBottom: 8 }}>
        Insights
      </Text>
      {insightWindows.map((w) => (
        <TouchableOpacity
          key={w.key}
          onPress={() => router.push(`/insights/${w.key}`)}
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: w.color,
            marginBottom: 8,
          }}
        >
          <Text>{w.label} — tap for details</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

