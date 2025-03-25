import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type CareHome = Database['public']['Tables']['care_homes']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function CreateShiftScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [careHomes, setCareHomes] = useState<CareHome[]>([]);
  const [staffMembers, setStaffMembers] = useState<Profile[]>([]);
  const [selectedCareHome, setSelectedCareHome] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/(auth)/sign-in');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profileData || profileData.role !== 'manager') {
        Alert.alert('Error', 'Only managers can create shifts');
        return router.back();
      }

      // Fetch care homes
      const { data: careHomesData } = await supabase
        .from('care_homes')
        .select('*')
        .order('name');
      
      if (careHomesData) {
        setCareHomes(careHomesData);
      }

      // Fetch available staff members
      const { data: staffData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff')
        .eq('is_available', true)
        .order('full_name');
      
      if (staffData) {
        setStaffMembers(staffData);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      Alert.alert('Error', 'Failed to load required data');
    }
  };

  const validateDateTime = () => {
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return 'Please enter valid dates and times';
    }

    if (startDateTime >= endDateTime) {
      return 'End time must be after start time';
    }

    if (startDateTime < new Date()) {
      return 'Start time cannot be in the past';
    }

    return null;
  };

  const handleCreateShift = async () => {
    try {
      setLoading(true);

      if (!selectedCareHome) {
        throw new Error('Please select a care home');
      }

      const validationError = validateDateTime();
      if (validationError) {
        throw new Error(validationError);
      }

      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      const { data, error } = await supabase
        .from('shifts')
        .insert({
          care_home_id: selectedCareHome,
          staff_id: selectedStaff,
          status: selectedStaff ? 'assigned' : 'open',
          start_time: startDateTime,
          end_time: endDateTime,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Success',
        'Shift created successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create New Shift</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.careHomeList}>
            {careHomes.map((home) => (
              <TouchableOpacity
                key={home.id}
                style={[
                  styles.careHomeCard,
                  selectedCareHome === home.id && styles.careHomeCardSelected
                ]}
                onPress={() => setSelectedCareHome(home.id)}>
                <MapPin
                  size={20}
                  color={selectedCareHome === home.id ? '#fff' : '#6b7280'}
                />
                <Text style={[
                  styles.careHomeName,
                  selectedCareHome === home.id && styles.careHomeNameSelected
                ]}>
                  {home.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeInput}>
              <Calendar size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Start Date (YYYY-MM-DD)"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            
            <View style={styles.dateTimeInput}>
              <Clock size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Start Time (HH:MM)"
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>
          </View>

          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeInput}>
              <Calendar size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="End Date (YYYY-MM-DD)"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
            
            <View style={styles.dateTimeInput}>
              <Clock size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="End Time (HH:MM)"
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assign Staff (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffList}>
            {staffMembers.map((staff) => (
              <TouchableOpacity
                key={staff.id}
                style={[
                  styles.staffCard,
                  selectedStaff === staff.id && styles.staffCardSelected
                ]}
                onPress={() => setSelectedStaff(staff.id)}>
                <Text style={[
                  styles.staffName,
                  selectedStaff === staff.id && styles.staffNameSelected
                ]}>
                  {staff.full_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateShift}
          disabled={loading}>
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Shift'}
          </Text>
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  careHomeList: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  careHomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  careHomeCardSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  careHomeName: {
    fontSize: 14,
    color: '#374151',
  },
  careHomeNameSelected: {
    color: '#fff',
  },
  dateTimeContainer: {
    marginBottom: 16,
  },
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#111827',
  },
  staffList: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  staffCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  staffCardSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  staffName: {
    fontSize: 14,
    color: '#374151',
  },
  staffNameSelected: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});