export type AiChatRole = 'user' | 'assistant' | 'system';

export type AiChatMessage = {
  id: string;
  role: AiChatRole;
  content: string;
  createdAt: string;
};

export type AiHistoryItem = {
  id: string;
  question: string;
  response: string;
  timestamp: string;
};

export type AiAskResponse = {
  text: string;
  model: string;
  role?: string;
  restaurantId?: string;
};

export const AI_HISTORY_LIMIT = 20;
export const AI_REQUEST_TIMEOUT_MS = 15_000;
