import { StyleSheet, View } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';

import { ThemedText } from '@/components/themed-text';
import type { ChartDataPoint } from '@/src/types';

type AnalyticsBarChartProps = {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
};

export function AnalyticsBarChart({
  data,
  color = '#0a7ea4',
  height = 280,
}: AnalyticsBarChartProps) {
  const chartData = data.map((point, index) => ({
    id: index,
    label: point.label,
    value: point.value,
  }));

  return (
    <View style={[styles.container, { height }]}>
      <CartesianChart
        data={chartData}
        xKey="label"
        yKeys={['value']}
        domainPadding={{ left: 24, right: 24, top: 24 }}>
        {({ points, chartBounds }) => (
          <Bar points={points.value} chartBounds={chartBounds} color={color} roundedCorners={{ topLeft: 4, topRight: 4 }} />
        )}
      </CartesianChart>
      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText>No chart data yet</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
