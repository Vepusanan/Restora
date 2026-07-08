import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { Send } from 'lucide-react-native';

import { ChatBubble } from '@/src/components/chat/ChatBubble';
import { ScreenContainer } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import type { ChatMessage } from '@/src/types/restora';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      'Hello! I\'m your Restora AI assistant. Ask me about inventory levels, expiring items, waste trends, or operational insights.',
    timestamp: new Date().toISOString(),
  },
];

const DEMO_RESPONSES: Record<string, string> = {
  expir: 'You have 7 items expiring soon. Chicken Breast (6 kg) expires Jul 9 — use the FIFO batch first.',
  waste: 'Waste cost this week is LKR 12,400. Chicken and tomatoes account for 65% of total waste.',
  stock: 'Low stock alert: Basmati Rice is at 25 kg. Coconut Milk has 12 L remaining.',
  default:
    'Based on your restaurant data, I recommend reviewing FIFO batches daily and logging waste within 1 hour of disposal. Connect Gemini API for live insights.',
};

export default function AdminAiScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1000));

    const lower = userMsg.content.toLowerCase();
    const responseKey = Object.keys(DEMO_RESPONSES).find((k) => lower.includes(k)) ?? 'default';

    const assistantMsg: ChatMessage = {
      id: `${Date.now()}_a`,
      role: 'assistant',
      content: DEMO_RESPONSES[responseKey],
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  }

  return (
    <ScreenContainer className="px-4">
      <ScreenHeader title="AI Assistant" subtitle="Admin — full operational access" showBack />

      <View className="flex-1 rounded-card border border-hairline bg-canvas p-3">
        <View className="flex-1">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {loading ? (
            <ChatBubble
              message={{
                id: 'typing',
                role: 'assistant',
                content: 'Analyzing your restaurant data...',
                timestamp: new Date().toISOString(),
              }}
            />
          ) : null}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="mt-2 flex-row items-end gap-2 border-t border-hairline-soft pt-3">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about inventory, waste, costs..."
              placeholderTextColor="#888888"
              multiline
              className="max-h-24 flex-1 rounded-md border border-hairline bg-surface px-4 py-3 text-base text-ink"
            />
            <Pressable
              onPress={handleSend}
              disabled={loading || !input.trim()}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary active:bg-charcoal disabled:opacity-40">
              <Send size={18} color="#ffffff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ScreenContainer>
  );
}
