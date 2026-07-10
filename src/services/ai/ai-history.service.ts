import AsyncStorage from '@react-native-async-storage/async-storage';
import { AI_HISTORY_LIMIT } from '@/types';
import type { AiHistoryItem } from '@/types';

const storageKey = (uid: string) => `restora:ai-history:${uid}`;

/**
 * FR-047 — session/local history, max 20 items per user.
 * Does not store restaurant context or API keys.
 */
export const aiHistoryService = {
  async list(uid: string): Promise<AiHistoryItem[]> {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as AiHistoryItem[];
      return Array.isArray(parsed) ? parsed.slice(0, AI_HISTORY_LIMIT) : [];
    } catch {
      return [];
    }
  },

  async add(
    uid: string,
    item: Omit<AiHistoryItem, 'id'> & { id?: string },
  ): Promise<AiHistoryItem[]> {
    const current = await this.list(uid);
    const nextItem: AiHistoryItem = {
      id: item.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      question: item.question,
      response: item.response,
      timestamp: item.timestamp,
    };
    const next = [nextItem, ...current].slice(0, AI_HISTORY_LIMIT);
    await AsyncStorage.setItem(storageKey(uid), JSON.stringify(next));
    return next;
  },

  async clear(uid: string): Promise<void> {
    await AsyncStorage.removeItem(storageKey(uid));
  },
};
