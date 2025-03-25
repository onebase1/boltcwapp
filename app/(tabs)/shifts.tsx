import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { useAuth } from '@/contexts/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { format, isSameDay, isToday, isTomorrow, isAfter } from 'date-fns';

type Shift = {
  id: string;
  start_time: string;
  end_time: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  role_needed: string;
  care_home: {
    name: string;
  };
  staff: {
    id: string;
    full_name: string;
  } | null;
};

export default function ShiftsScreen() {
  const { profile, loading: profileLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    if (profile && !profileLoading) {
      fetchShifts();
    }
  }, [profile, profileLoading, activeFilter]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('shifts')
        .select(`
          id,
          start_time,
          end_time,
          status,
          role_needed,
          care_home:care_home_id (name),
          staff:staff_id (
            id,
            full_name
          )
        `)
        .order('start_time', { ascending: true });
      
      // Apply filters based on user role and active filter
      if (profile.role === 'staff') {
        query = query.eq('staff_id', profile.id);
      } else if (profile.role === 'manager') {
        // TODO: Add filter to only show shifts for care homes managed by this manager
      }
      
      // Filter by time/status
      const now = new Date();
      
      if (activeFilter === 'today') {
        // Get today's shifts
        const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const todayEnd = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        query = query.gte('start_time', todayStart).lte('start_time', todayEnd);
      } else if (activeFilter === 'upcoming') {
        // Get future shifts
        query = query.gt('start_time', now.toISOString());
      } else if (activeFilter === 'completed') {
        // Get completed shifts
        query = query.eq('status', 'completed');
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setShifts(data || []);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      Alert.alert('Error', 'Failed to load shifts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchShifts();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#ef4444'; // Red for unfilled shifts
      case 'assigned':
        return '#f59e0b'; // Amber for assigned shifts
      case 'in_progress':
        return '#10b981'; // Green for in-progress shifts
      case 'completed':
        return '#2563eb'; // Blue for completed shifts
      case 'cancelled':
        return '#6b7280'; // Gray for cancelled shifts
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Unfilled';
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEE, d MMM');
    }
  };

  const groupShiftsByDate = () => {
    const grouped: Record<string, Shift[]> = {};
    
    shifts.forEach(shift => {
      const date = new Date(shift.start_time);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(shift);
    });
    
    return grouped;
  };

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shifts</Text>
        
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/create-shift')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'all' && styles.activeFilterButton]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'today' && styles.activeFilterButton]}
            onPress={() => setActiveFilter('today')}
          >
            <Text style={[styles.filterText, activeFilter === 'today' && styles.activeFilterText]}>
              Today
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'upcoming' && styles.activeFilterButton]}
            onPress={() => setActiveFilter('upcoming')}
          >
            <Text style={[styles.filterText, activeFilter === 'upcoming' && styles.activeFilterText]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'completed' && styles.activeFilterButton]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[styles.filterText, activeFilter === 'completed' && styles.activeFilterText]}>
              Completed
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading shifts...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2563eb']}
            />
          }
        >
          {shifts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No shifts found</Text>
              <Text style={styles.emptySubtext}>
                {activeFilter !== 'all' 
                  ? `Try changing the filter or pull down to refresh`
                  : `Pull down to refresh or create a new shift`}
              </Text>
            </View>
          ) : (
            Object.entries(groupShiftsByDate()).map(([dateKey, dateShifts]) => (
              <View key={dateKey} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>
                  {getFormattedDate(dateKey)}
                </Text>
                
                {dateShifts.map(shift => (
                  <TouchableOpacity 
                    key={shift.id} 
                    style={styles.shiftCard}
                    onPress={() => router.push(`/shift/${shift.id}`)}
                  >
                    <View style={styles.shiftCardHeader}>
                      <View>
                        <Text style={styles.shiftTime}>
                          {format(new Date(shift.start_time), 'h:mm a')} - {format(new Date(shift.end_time), 'h:mm a')}
                        </Text>
                        <Text style={styles.careHomeName}>{shift.care_home.name}</Text>
                      </View>
                      
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(shift.status) + '20' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(shift.status) }
                        ]}>
                          {getStatusText(shift.status)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.shiftCardBody}>
                      <Text style={styles.roleNeeded}>
                        {shift.role_needed.charAt(0).toUpperCase() + shift.role_needed.slice(1)}
                      </Text>
                      
                      {shift.staff ? (
                        <Text style={styles.staffName}>Staff: {shift.staff.full_name}</Text>
                      ) : (
                        <Text style={styles.noStaff}>No staff assigned</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  activeFilterText: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 12,
  },
  shiftCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  shiftTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  careHomeName: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  shiftCardBody: {
    padding: 16,
  },
  roleNeeded: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  staffName: {
    fontSize: 14,
    color: '#6b7280',
  },
  noStaff: {
    fontSize: 14,
    color: '#ef4444',
    fontStyle: 'italic',
  },
});
