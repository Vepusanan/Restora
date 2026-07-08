import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Check, X } from 'lucide-react-native';

import { Badge } from '@/src/components/ui/Badge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { formatDate, MOCK_STAFF } from '@/src/data/mock';
import type { StaffMember } from '@/src/types/restora';

export default function StaffManagementScreen() {
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);

  function handleApprove(member: StaffMember) {
    setStaff((prev) =>
      prev.map((s) => (s.id === member.id ? { ...s, status: 'approved' } : s)),
    );
    Alert.alert('Approved', `${member.name} can now access the restaurant.`);
  }

  function handleReject(member: StaffMember) {
    setStaff((prev) => prev.filter((s) => s.id !== member.id));
    Alert.alert('Rejected', `${member.name}'s request has been removed.`);
  }

  const pending = staff.filter((s) => s.status === 'pending');

  return (
    <Screen>
      <ScreenHeader
        title="Staff Management"
        subtitle="Approve registrations and manage team"
        showBack
      />

      {pending.length > 0 ? (
        <View className="mb-4 rounded-card border border-warning/25 bg-warning/[0.08] p-4">
          <Text className="font-semibold text-ink">
            {pending.length} pending approval{pending.length > 1 ? 's' : ''}
          </Text>
        </View>
      ) : null}

      {staff.length === 0 ? (
        <EmptyState
          title="No staff members"
          message="Staff who register with your restaurant code will appear here for approval."
        />
      ) : (
        staff.map((member) => (
          <View
            key={member.id}
            className="mb-3 rounded-card border border-hairline bg-canvas p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold text-ink">{member.name}</Text>
                <Text className="text-sm text-steel">{member.email}</Text>
                <Text className="mt-1 text-caption text-stone">Joined {formatDate(member.joinedAt)}</Text>
              </View>
              <Badge
                label={member.status === 'approved' ? 'Active' : 'Pending'}
                variant={member.status === 'approved' ? 'success' : 'warning'}
              />
            </View>

            {member.status === 'pending' ? (
              <View className="mt-4 flex-row gap-3">
                <Pressable
                  onPress={() => handleApprove(member)}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-primary py-3 active:bg-charcoal">
                  <Check size={18} color="#ffffff" />
                  <Text className="text-sm font-medium text-on-primary">Approve</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleReject(member)}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-hairline py-3 active:bg-surface">
                  <X size={18} color="#d45656" />
                  <Text className="text-sm font-medium text-danger">Reject</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))
      )}
    </Screen>
  );
}
