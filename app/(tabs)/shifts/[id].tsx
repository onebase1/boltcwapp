import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Clock, User, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Shift = Database['public']['Tables']['shifts']['Row'] & {
  care_homes: Database['public']['Tables']['care_homes']['Row'];
  profiles: Database['public']['Tables']['profiles']['Row'] | null;
};

export default function ShiftDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState<Shift | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchShiftDetails();
  }, [id]);

  const fetchShiftDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/(auth)/sign-in');

      setUserId(user.id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setUserRole(profileData.role);
      }

      const { data: shiftData } = await supabase
        .from('shifts')
        .select(`
          *,
          care_homes (*),
          profiles:staff_id (*)
        `)
        .eq('id', id)
        .single();

      if (shiftData) {
        setShift(shiftData);
      }
    } catch (error) {
      console.error('Error fetching shift details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'in_progress') {
        updates.check_in_time = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updates.check_out_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('shifts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      fetchShiftDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to update shift status');
    }
  };

  const handleCancelShift = async () => {
    Alert.alert(
      'Cancel Shift',
      'Are you sure you want to cancel this shift?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('shifts')
                .update({
                  status: 'cancelled',
                  cancelled_at: new Date().toISOString(),
                  cancelled_by: userId,
                })
                .eq('id', id);

              if (error) throw error;

              fetchShiftDetails();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel shift');
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading shift details...</Text>
      </View>
    );
  }

  if (!shift) {
    return (
      <View style={styles.container}>
        <Text>Shift not found</Text>
      </View>
    );
  }

  const isStaffAssigned = shift.staff_id === userId;
  const canManageShift = userRole === 'manager' || isStaffAssigned;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(shift.status) }
        ]}>
          <Text style={styles.statusText}>
            {shift.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardSection}>
          <Clock size={20} color="#6b7280" />
          <View>
            <Text style={styles.label}>Start Time</Text>
            <Text style={styles.value}>{formatDateTime(shift.start_time)}</Text>
          </View>
        </View>

        <View style={styles.cardSection}>
          <Clock size={20} color="#6b7280" />
          <View>
            <Text style={styles.label}>End Time</Text>
            <Text style={styles.value}>{formatDateTime(shift.end_time)}</Text>
          </View>
        </View>

        <View style={styles.cardSection}>
          <MapPin size={20} color="#6b7280" />
          <View>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{shift.care_homes.name}</Text>
            <Text style={styles.subtitle}>{shift.care_homes.address}</Text>
          </View>
        </View>

        {shift.profiles && (
          <View style={styles.cardSection}>
            <User size={20} color="#6b7280" />
            <View>
              <Text style={styles.label}>Assigned Staff</Text>
              <Text style={styles.value}>{shift.profiles.full_name}</Text>
              <Text style={styles.subtitle}>{shift.profiles.email}</Text>
            </View>
          </View>
        )}

        {shift.check_in_time && (
          <View style={styles.cardSection}>
            <CheckCircle size={20} color="#16a34a" />
            <View>
              <Text style={styles.label}>Check-in Time</Text>
              <Text style={styles.value}>{formatDateTime(shift.check_in_time)}</Text>
            </View>
          </View>
        )}

        {shift.check_out_time && (
          <View style={styles.cardSection}>
            <CheckCircle size={20} color="#2563eb" />
            <View>
              <Text style={styles.label}>Check-out Time</Text>
              <Text style={styles.value}>{formatDateTime(shift.check_out_time)}</Text>
            </View>
          </View>
        )}

        {shift.cancelled_at && (
          <View style={styles.cardSection}>
            <XCircle size={20} color="#dc2626" />
            <View>
              <Text style={styles.label}>Cancelled At</Text>
              <Text style={styles.value}>{formatDateTime(shift.cancelled_at)}</Text>
            </View>
          </View>
        )}
      </View>

      {canManageShift && shift.status !== 'cancelled' && shift.status !== 'completed' && (
        <View style={styles.actions}>
          {isStaffAssigned && shift.status === 'assigned' && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => handleStatusUpdate('in_progress')}>
              <Text style={styles.buttonText}>Start Shift</Text>
            </TouchableOpacity>
          )}

          {isStaffAssigned && shift.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => handleStatusUpdate('completed')}>
              <Text style={styles.buttonText}>Complete Shift</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleCancelShift}>
            <Text style={styles.buttonText}>Cancel Shift</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return '#9333ea';
    case 'assigned': return '#2563eb';
    case 'in_progress': return '#16a34a';
    case 'completed': return '#64748b';
    case 'cancelled': return '#dc2626';
    default: return '#6b7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});