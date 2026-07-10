import { AnalyticsDashboardScreen } from '@components/analytics/AnalyticsDashboardScreen';

/**
 * Admin Analytics tab — live waste/cost/inventory dashboard (FR-036–FR-041).
 * Staff cannot reach this route; access is enforced by the (admin) layout.
 */
export default function AdminAnalyticsScreen() {
  return <AnalyticsDashboardScreen />;
}
