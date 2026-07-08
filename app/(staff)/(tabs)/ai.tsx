import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
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
      'Hi! I can help with inventory levels, expiry dates, and FIFO guidance. Financial data is not available in staff mode.',
    timestamp: new Date().toISOString(),
  },
];

export default function StaffAiScreen() {
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
    await new Promise((r) => setTimeout(r, 900));

    const assistantMsg: ChatMessage = {
      id: `${Date.now()}_a`,
      role: 'assistant',
      content:
        userMsg.content.toLowerCase().includes('cost') || userMsg.content.toLowerCase().includes('waste cost')
          ? 'Cost and financial summaries are restricted to admin accounts. I can help with inventory quantities and expiry dates instead.'
          : 'Chicken Breast FIFO batch (6 kg) expires Jul 9. Tomatoes batch is expired — please log waste and remove from inventory.',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  }

  return (
    <ScreenContainer className="px-4">
      <ScreenHeader title="AI Assistant" subtitle="Staff — operational queries only" />

      <View className="mb-3 rounded-md border border-warning/25 bg-warning/[0.08] p-3">
        <Text className="text-caption text-ink">
          Financial queries are filtered. Ask about stock levels, expiry, or FIFO batches.
        </Text>
      </View>

      <View className="flex-1 rounded-card border border-hairline bg-canvas p-3">
        <View className="flex-1">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="mt-2 flex-row items-end gap-2 border-t border-hairline-soft pt-3">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about stock or expiry..."
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
