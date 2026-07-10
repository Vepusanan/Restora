import { useCallback, useEffect, useState } from 'react';
import { aiAssistantService } from '@services/ai/ai-assistant.service';
import { aiHistoryService } from '@services/ai/ai-history.service';
import { useAuth } from '@hooks/useAuth';
import type { AiChatMessage, AiHistoryItem, ServiceError } from '@/types';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useAiAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [history, setHistory] = useState<AiHistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setHistory([]);
      return;
    }
    void aiHistoryService.list(user.uid).then(setHistory);
  }, [user?.uid]);

  const ask = useCallback(async () => {
    if (!user?.uid || loading) return;
    const question = input.trim();
    if (!question) return;

    const userMessage: AiChatMessage = {
      id: makeId('u'),
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const result = await aiAssistantService.ask(question);
      const assistantMessage: AiChatMessage = {
        id: makeId('a'),
        role: 'assistant',
        content: result.text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const nextHistory = await aiHistoryService.add(user.uid, {
        question,
        response: result.text,
        timestamp: new Date().toISOString(),
      });
      setHistory(nextHistory);
    } catch (err) {
      const message =
        (err as ServiceError).message ||
        'AI Assistant is currently unavailable. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, input, loading]);

  const clearHistory = useCallback(async () => {
    if (!user?.uid) return;
    await aiHistoryService.clear(user.uid);
    setHistory([]);
  }, [user?.uid]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const reuseHistoryItem = useCallback((item: AiHistoryItem) => {
    setInput(item.question);
  }, []);

  return {
    messages,
    history,
    input,
    setInput,
    loading,
    error,
    setError,
    ask,
    clearHistory,
    clearConversation,
    reuseHistoryItem,
  };
}
