import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '@components/ui/Button';
import { InlineError } from '@components/ui/InlineError';
import { useAiAssistant } from '@hooks/useAiAssistant';
import { useAuth } from '@hooks/useAuth';
import { colors, spacing } from '@constants/theme';

export function AiAssistantScreen() {
  const { profile, isAdmin } = useAuth();
  const {
    messages,
    history,
    input,
    setInput,
    loading,
    error,
    ask,
    clearHistory,
    clearConversation,
    reuseHistoryItem,
  } = useAiAssistant();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.subtitle}>
          Ask about inventory and waste
          {isAdmin ? ', costs, and analytics' : ' (operational data only)'}.
        </Text>
        <Text style={styles.meta}>{profile?.restaurantName ?? 'Restaurant'}</Text>
      </View>

      <InlineError message={error || undefined} />

      {history.length > 0 ? (
        <View style={styles.history}>
          <View style={styles.historyHeader}>
            <Text style={styles.section}>Recent questions</Text>
            <Pressable onPress={() => void clearHistory()}>
              <Text style={styles.link}>Clear history</Text>
            </Pressable>
          </View>
          <FlatList
            horizontal
            data={history.slice(0, 8)}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyList}
            renderItem={({ item }) => (
              <Pressable style={styles.historyChip} onPress={() => reuseHistoryItem(item)}>
                <Text style={styles.historyChipText} numberOfLines={2}>
                  {item.question}
                </Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      <FlatList
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        data={messages}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Ask questions about your restaurant operations.</Text>
            <Text style={styles.emptyBody}>
              Try: “Which ingredients expire soon?” or “What was wasted this month?”
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                item.role === 'user' ? styles.userText : styles.assistantText,
              ]}
            >
              {item.content}
            </Text>
          </View>
        )}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Analyzing your data…</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Restora AI…"
          placeholderTextColor={colors.textSecondary}
          editable={!loading}
          multiline
          maxLength={2000}
        />
        <View style={styles.actions}>
          <View style={styles.actionGrow}>
            <Button
              title="Clear chat"
              variant="ghost"
              onPress={clearConversation}
              disabled={loading || messages.length === 0}
            />
          </View>
          <View style={styles.actionGrow}>
            <Button title="Send" onPress={() => void ask()} loading={loading} />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: 4 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  meta: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  history: { paddingTop: spacing.sm },
  historyHeader: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: { fontSize: 13, fontWeight: '700', color: colors.text },
  link: { fontSize: 13, fontWeight: '600', color: colors.primary },
  historyList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  historyChip: {
    maxWidth: 180,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  historyChipText: { fontSize: 12, color: colors.textSecondary },
  chat: { flex: 1 },
  chatContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  bubble: {
    maxWidth: '92%',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#FFFFFF' },
  assistantText: { color: colors.text },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  loadingText: { color: colors.textSecondary, fontSize: 13 },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  input: {
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionGrow: { flex: 1 },
});
