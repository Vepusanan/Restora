import { Text, View } from 'react-native';
import { Bot, User } from 'lucide-react-native';

import type { ChatMessage } from '@/src/types/restora';

type ChatBubbleProps = {
  message: ChatMessage;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View className={`mb-3 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser ? (
        <View className="mr-2 mt-1 h-8 w-8 items-center justify-center rounded-full bg-mint/15">
          <Bot size={16} color="#00b48a" />
        </View>
      ) : null}
      <View
        className={`max-w-[80%] rounded-xl px-4 py-3 ${isUser ? 'rounded-br-sm bg-primary' : 'rounded-bl-sm border border-hairline bg-canvas'}`}>
        <Text className={`text-sm leading-5 ${isUser ? 'text-on-primary' : 'text-ink'}`}>
          {message.content}
        </Text>
      </View>
      {isUser ? (
        <View className="ml-2 mt-1 h-8 w-8 items-center justify-center rounded-full bg-surface">
          <User size={16} color="#5a5a5c" />
        </View>
      ) : null}
    </View>
  );
}
