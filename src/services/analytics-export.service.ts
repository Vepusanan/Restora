import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildAnalyticsCsv, buildAnalyticsPdfHtml } from '@utils/export';
import { createServiceError, toServiceError } from '@utils/errors';
import { auditService } from './audit.service';
import { useAuthStore } from '@store/authStore';
import type { AnalyticsDashboardSnapshot, AnalyticsExportFormat } from '@/types';

function fileSafeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 40) || 'restaurant';
}

/**
 * FR-041 — export current analytics dashboard view as CSV or PDF.
 */
export const analyticsExportService = {
  async export(
    snapshot: AnalyticsDashboardSnapshot,
    format: AnalyticsExportFormat,
  ): Promise<{ uri: string; format: AnalyticsExportFormat }> {
    try {
      const stamp = snapshot.generatedAt.slice(0, 10);
      const base = `restora-analytics-${fileSafeName(snapshot.restaurantName)}-${stamp}`;

      if (format === 'csv') {
        const csv = buildAnalyticsCsv(snapshot);
        const fileUri = `${FileSystem.cacheDirectory}${base}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export analytics CSV',
            UTI: 'public.comma-separated-values-text',
          });
        } else if (Platform.OS === 'web') {
          await Share.share({ message: csv, title: 'Restora Analytics CSV' });
        } else {
          throw createServiceError('restora/export-unavailable', 'Sharing is not available on this device.');
        }

        await auditService.writeSafe({
          action: 'analytics_exported',
          restaurantId: useAuthStore.getState().profile?.restaurantId ?? '',
          target: {
            collection: 'analytics',
            documentId: useAuthStore.getState().profile?.restaurantId ?? '',
            name: snapshot.restaurantName,
          },
          before: null,
          after: { format: 'csv', generatedAt: snapshot.generatedAt },
        });

        return { uri: fileUri, format };
      }

      const html = buildAnalyticsPdfHtml(snapshot);
      const printed = await Print.printToFileAsync({ html });
      const targetUri = `${FileSystem.cacheDirectory}${base}.pdf`;
      await FileSystem.copyAsync({ from: printed.uri, to: targetUri });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export analytics PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Print.printAsync({ html });
      }

      await auditService.writeSafe({
        action: 'analytics_exported',
        restaurantId: useAuthStore.getState().profile?.restaurantId ?? '',
        target: {
          collection: 'analytics',
          documentId: useAuthStore.getState().profile?.restaurantId ?? '',
          name: snapshot.restaurantName,
        },
        before: null,
        after: { format: 'pdf', generatedAt: snapshot.generatedAt },
      });

      return { uri: targetUri, format: 'pdf' };
    } catch (error) {
      throw toServiceError(error, 'Unable to export analytics report');
    }
  },
};
