import Constants from 'expo-constants';

import { AnalyticsBarChart } from '@/src/components/charts/AnalyticsBarChart';
import { ChartPlaceholder } from '@/src/components/charts/ChartPlaceholder';
import type { ChartDataPoint } from '@/src/types';

type AnalyticsChartProps = {
  data: ChartDataPoint[];
};

// Victory Native depends on Skia, which is not bundled in Expo Go.
const isExpoGo = Constants.appOwnership === 'expo';

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  if (isExpoGo) {
    return <ChartPlaceholder />;
  }

  return <AnalyticsBarChart data={data} />;
}
