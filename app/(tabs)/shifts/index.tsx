import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Shift = Database['public']['Tables']['shifts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ShiftsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/(auth)/sign-in');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        const shiftsQuery = supabase
          .from('shifts')
          .select('*, care_homes(*)');

        if (profileData.role === 'staff') {
          shiftsQuery.eq('staff_id', user.id);
        }

        const { data: shiftsData } = await shiftsQuery;
        setShifts(shiftsData || []);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString([], { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading shifts...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Your Shifts</Text>
        {profile?.role === 'manager' && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/shifts/create')}>
            <Text style={styles.createButtonText}>Create Shift</Text>
          </TouchableOpacity>
        )}
      </View>

      {shifts.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color="#6b7280" />
          <Text style={styles.emptyStateTitle}>No shifts found</Text>
          <Text style={styles.emptyStateText}>
            {profile?.role === 'manager' 
              ? 'Create a new shift to get started'
              : 'No shifts are currently assigned to you'}
          </Text>
        </View>
      ) : (
        shifts.map((shift) => (
          <TouchableOpacity
            key={shift.id}
            style={styles.shiftCard}
            onPress={() => router.push(`/shifts/${shift.id}`)}>
            <View style={styles.shiftHeader}>
              <Text style={styles.shiftDate}>{formatDate(shift.start_time)}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(shift.status) }
              ]}>
                <Text style={styles.statusText}>
                  {shift.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.shiftDetails}>
              <View style={styles.timeContainer}>
                <Clock size={16} color="#6b7280" />
                <Text style={styles.timeText}>
                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                </Text>
              </View>

              {shift.care_homes && (
                <Text style={styles.locationText}>
                  {shift.care_homes.name}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  shiftCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  shiftDetails: {
    gap: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: '#6b7280',
    fontSize: 14,
  },
  locationText: {
    color: '#374151',
    fontSize: 14,
  },
});