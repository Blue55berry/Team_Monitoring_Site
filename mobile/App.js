import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import Modal from 'react-native-modal';
import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ApolloProvider, useMutation } from '@apollo/client/react';

// Configure Apollo Client for GraphQL with Auth Link
const httpLink = new HttpLink({
  uri: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.70.153:4000/graphql',
});

const authLink = setContext(async (_, { headers }) => {
  // Retrieve the auth token from high security storage
  const token = await SecureStore.getItemAsync('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        firstName
        lastName
        role
      }
    }
  }
`;

const CHECK_IN_MUTATION = gql`
  mutation CheckIn($notes: String, $location: LocationInput, $device: String) {
    checkIn(notes: $notes, location: $location, device: $device) {
      id
      status
      checkIn
    }
  }
`;

const CHECK_OUT_MUTATION = gql`
  mutation CheckOut($device: String) {
    checkOut(device: $device) {
      id
      checkOut
      workHours
    }
  }
`;

const DASHBOARD_STATS_QUERY = gql`
  query DashboardStats {
    dashboardStats {
      totalEmployees
      activeProjects
      pendingTasks
      presentToday
    }
  }
`;

const TODAY_ATTENDANCE_QUERY = gql`
  query TodayAttendance {
    todayAttendance {
      id
      checkIn
      checkOut
      status
    }
  }
`;

const MY_TASKS_QUERY = gql`
  query MyTasks {
    myTasks {
      id
      title
      status
      priority
    }
  }
`;

const REQUEST_LEAVE_MUTATION = gql`
  mutation RequestLeave($input: LeaveInput!) {
    requestLeave(input: $input) {
      id
      type
      startDate
      endDate
      status
    }
  }
`;

const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($id: ID!, $input: TaskUpdateInput!) {
    updateTask(id: $id, input: $input) {
      id
      status
    }
  }
`;

const MY_ATTENDANCE_QUERY = gql`
  query MyAttendance {
    myAttendance {
      id
      date
      status
      checkIn
      checkOut
    }
  }
`;

function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both email and password.');
      return;
    }

    try {
      const { data } = await loginMutation({
        variables: { input: { email: email.trim(), password } }
      });

      if (data?.login?.accessToken) {
        // High security token storage
        await SecureStore.setItemAsync('accessToken', data.login.accessToken);
        await SecureStore.setItemAsync('userRole', data.login.user.role);
        await SecureStore.setItemAsync('userName', data.login.user.firstName);
        if (data.login.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', data.login.refreshToken);
        }
        Alert.alert('Success', `Welcome back, ${data.login.user.firstName}! (${data.login.user.role})`);
        onLoginSuccess(data.login.user.role, data.login.user.firstName);
      }
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials or server error.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.loginBox}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your Xenocoders account</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

import * as LocalAuthentication from 'expo-local-authentication';

function AttendanceWidget({ onLogout }) {
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationOffModal, setLocationOffModal] = useState(false);

  const { data: attendanceData, refetch: refetchAttendance } = useQuery(TODAY_ATTENDANCE_QUERY, { fetchPolicy: 'network-only' });
  const [checkIn, { loading: checkingIn }] = useMutation(CHECK_IN_MUTATION);
  const [checkOut, { loading: checkingOut }] = useMutation(CHECK_OUT_MUTATION);

  const todayRecord = attendanceData?.todayAttendance;
  const isCheckedIn = !!todayRecord?.checkIn;
  const isCheckedOut = !!todayRecord?.checkOut;
  const isAbsent = todayRecord?.status === 'absent';

  const authenticateUser = async (actionText) => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Verify Identity to ${actionText}`,
          fallbackLabel: 'Use Passcode',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });
        return result.success;
      }
      // If no hardware/not enrolled, we bypass for fallback, 
      // but in strict mode we would return false.
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleCheckIn = async () => {
    setLoadingLocation(true);
    try {
      // Biometric check first
      const isAuthenticated = await authenticateUser('Check In');
      if (!isAuthenticated) {
        setLoadingLocation(false);
        Alert.alert('Authentication Failed', 'Identity verification is required to check in.');
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoadingLocation(false);
        setLocationOffModal(true);
        return;
      }

      let isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        setLoadingLocation(false);
        setLocationOffModal(true);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const userLocation = { lat: location.coords.latitude, lng: location.coords.longitude };

      const response = await checkIn({ variables: { notes: "Mobile App Check-In", location: userLocation, device: 'mobile' } });
      setLoadingLocation(false);
      refetchAttendance();

      if (response.data.checkIn.status === 'absent') {
        Alert.alert(
          'Outside Office Area (Absent)', 
          `Your phone reported your location as:\nLat: ${userLocation.lat.toFixed(4)}\nLng: ${userLocation.lng.toFixed(4)}\n\nThis is outside the radius set in the Admin Panel. You have been marked absent.`
        );
      } else {
        Alert.alert('Success', `Checked in successfully! Status: ${response.data.checkIn.status}`);
      }
    } catch (err) {
      setLoadingLocation(false);
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    }
  };

  const handleCheckOut = async () => {
    try {
      const isAuthenticated = await authenticateUser('Check Out');
      if (!isAuthenticated) {
        Alert.alert('Authentication Failed', 'Identity verification is required to check out.');
        return;
      }

      await checkOut({ variables: { device: 'mobile' } });
      Alert.alert('Success', 'Checked out successfully. Have a great day!');
      refetchAttendance();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to check out.');
    }
  };

  return (
      <View style={[styles.card, { padding: 24, borderRadius: 24, marginBottom: 24 }]}>
        <Text style={[styles.cardTitle, { fontSize: 20 }]}>Daily Attendance</Text>
        <Text style={[styles.cardSubtitle, { fontSize: 13, marginTop: 4 }]}>Mark your presence based on your GPS location.</Text>
        
        {!isCheckedIn ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#4ade80' }, (checkingIn || loadingLocation) && styles.buttonDisabled]}
            onPress={handleCheckIn}
            disabled={checkingIn || loadingLocation}
          >
            {checkingIn || loadingLocation ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.buttonText, { fontSize: 16 }]}>Check In Now</Text>
            )}
          </TouchableOpacity>
        ) : isAbsent ? (
          <View style={[styles.button, { backgroundColor: '#ef4444' }]}>
            <Text style={[styles.buttonText, { fontSize: 16 }]}>Outside Office</Text>
          </View>
        ) : !isCheckedOut ? (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <View style={[styles.button, { backgroundColor: '#4ade80', flex: 1, minWidth: 0, paddingVertical: 14, borderRadius: 16, elevation: 4, shadowColor: '#4ade80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }]}>
              <Text style={[styles.buttonText, { fontSize: 15 }]}>Checked In</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#f97316', flex: 1, minWidth: 0, paddingVertical: 14, borderRadius: 16, elevation: 4, shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, checkingOut && styles.buttonDisabled]}
              onPress={handleCheckOut}
              disabled={checkingOut}
            >
              {checkingOut ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, { fontSize: 15 }]}>Check Out</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.button, { backgroundColor: '#64748b' }]}>
            <Text style={styles.buttonText}>Shift Completed</Text>
          </View>
        )}

      {/* Modern Pop Box Notification for Location Disabled */}
      <Modal isVisible={locationOffModal} animationIn="bounceIn" animationOut="bounceOut" backdropOpacity={0.6}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}><Text style={styles.iconText}>📍</Text></View>
          <Text style={styles.modalTitle}>Location Required</Text>
          <Text style={styles.modalText}>Please turn on your device's location services to verify your presence at the office.</Text>
          <TouchableOpacity style={styles.modalButton} onPress={() => setLocationOffModal(false)}>
            <Text style={styles.modalButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

import { useQuery } from '@apollo/client/react';
import { WebView } from 'react-native-webview';

const AdminCompanyOverview = ({ statsLoading, statsData, onWebAccess }) => (
  <View style={styles.card}>
    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
      <Text style={styles.cardTitle}>Company Overview</Text>
      <TouchableOpacity onPress={onWebAccess} style={styles.webAccessButton}>
        <Text style={styles.webAccessText}>Open Web Panel 🌐</Text>
      </TouchableOpacity>
    </View>
    {statsLoading ? <ActivityIndicator /> : (
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{statsData?.dashboardStats?.totalEmployees || 0}</Text>
          <Text style={styles.statLabel}>Employees</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{statsData?.dashboardStats?.presentToday || 0}</Text>
          <Text style={styles.statLabel}>Present Today</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{statsData?.dashboardStats?.activeProjects || 0}</Text>
          <Text style={styles.statLabel}>Active Projects</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{statsData?.dashboardStats?.pendingTasks || 0}</Text>
          <Text style={styles.statLabel}>Pending Tasks</Text>
        </View>
      </View>
    )}
  </View>
);

const EmployeePerformanceGraph = ({ tasksLoading, tasksData }) => {
  if (tasksLoading || !tasksData?.myTasks) return null;
  const total = tasksData.myTasks.length;
  const completed = tasksData.myTasks.filter(t => t.status === 'completed').length;
  const inProgress = tasksData.myTasks.filter(t => t.status === 'in_progress').length;
  const todo = total - completed - inProgress;
  
  const compPct = total > 0 ? (completed / total) * 100 : 0;
  const progPct = total > 0 ? (inProgress / total) * 100 : 0;
  const todoPct = total > 0 ? (todo / total) * 100 : 100;

  return (
    <>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
        <Text style={styles.cardTitle}>Performance Overview</Text>
      </View>
      <View style={[styles.card, { marginBottom: 24, padding: 24, borderRadius: 24 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8, gap: 10 }}>
          <View style={{ backgroundColor: '#4ade80', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, opacity: compPct > 0 ? 1 : 0 }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{Math.round(compPct)}% Done</Text></View>
          <View style={{ backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, opacity: todoPct > 0 ? 1 : 0 }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{Math.round(todoPct)}% Todo</Text></View>
        </View>
        <View style={{ flexDirection: 'row', height: 32, borderRadius: 16, overflow: 'hidden', backgroundColor: '#e2e8f0', marginBottom: 16 }}>
          {compPct > 0 && (
            <View style={{ width: `${compPct}%`, backgroundColor: '#4ade80', justifyContent: 'center', alignItems: 'center', borderRightWidth: 2, borderColor: '#fff' }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{Math.round(compPct)}% Done</Text>
            </View>
          )}
          {progPct > 0 && (
            <View style={{ width: `${progPct}%`, backgroundColor: '#fbbf24', justifyContent: 'center', alignItems: 'center', borderRightWidth: 2, borderColor: '#fff' }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{Math.round(progPct)}% In Prog</Text>
            </View>
          )}
          {todoPct > 0 && (
            <View style={{ width: `${todoPct}%`, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' }} />
          )}
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ade80', marginRight: 6 }} />
            <Text style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 'bold' }}>Completed</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#fbbf24', marginRight: 6 }} />
            <Text style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 'bold' }}>In Progress</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444', marginRight: 6 }} />
            <Text style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 'bold' }}>To Do</Text>
          </View>
        </View>
      </View>
    </>
  );
};

const EmployeeQuickActions = ({ onApplyLeave }) => (
  <>
    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
      <Text style={styles.cardTitle}>Quick Actions</Text>
    </View>
    
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, paddingBottom: 10, overflow: 'visible' }}>
      <TouchableOpacity onPress={onApplyLeave} style={styles.quickActionCard}>
        <View style={[styles.quickActionIconBg, { backgroundColor: '#f0fdf4' }]}><Text style={{fontSize: 24}}>📅</Text></View>
        <Text style={styles.quickActionText}>Apply{'\n'}Leave</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickActionCard}>
        <View style={[styles.quickActionIconBg, { backgroundColor: '#fffbeb' }]}><Text style={{fontSize: 24}}>💼</Text></View>
        <Text style={styles.quickActionText}>Expense{'\n'}Claims</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickActionCard}>
        <View style={[styles.quickActionIconBg, { backgroundColor: '#eff6ff' }]}><Text style={{fontSize: 24}}>📄</Text></View>
        <Text style={styles.quickActionText}>Payslips</Text>
      </TouchableOpacity>
    </ScrollView>
  </>
);

const EmployeeRecentTasks = ({ tasksLoading, tasksData, onTaskToggle }) => (
  <>
    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
      <Text style={styles.cardTitle}>Recent Tasks</Text>
    </View>
    <View style={[styles.card, { padding: 24, borderRadius: 24 }]}>
      {tasksLoading ? <ActivityIndicator /> : (
        <View style={styles.taskList}>
          {tasksData?.myTasks?.length > 0 ? (
            tasksData.myTasks.slice(0, 3).map(task => (
              <TouchableOpacity key={task.id} onPress={() => onTaskToggle(task)} style={styles.taskItem}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={{fontSize: 10, color: '#64748b', marginTop: 2}}>Tap to update status</Text>
                </View>
                <Text style={[styles.taskStatus, task.status === 'completed' && {backgroundColor: '#dcfce7', color: '#16a34a'}]}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>You have no pending tasks today!</Text>
          )}
        </View>
      )}
    </View>
  </>
);

const LeaveRequestModal = ({ visible, onClose, onSubmit, leaveType, setLeaveType, leaveReason, setLeaveReason, loading }) => (
  <Modal isVisible={visible} animationIn="fadeInUp" animationOut="fadeOutDown" backdropOpacity={0.6}>
    <View style={styles.modalContent}>
      <View style={styles.iconContainer}><Text style={styles.iconText}>🏖️</Text></View>
      <Text style={styles.modalTitle}>Request Leave</Text>
      
      <TextInput 
        value={leaveType}
        onChangeText={setLeaveType}
        placeholder="Leave Type (sick, casual)" 
        style={[styles.input, {width: '100%', marginBottom: 12}]}
      />
      <TextInput 
        value={leaveReason}
        onChangeText={setLeaveReason}
        placeholder="Reason for leave..." 
        style={[styles.input, {width: '100%', marginBottom: 24, height: 80, textAlignVertical: 'top'}]}
        multiline
      />
      
      <View style={{flexDirection: 'row', gap: 10, width: '100%'}}>
        <TouchableOpacity style={[styles.modalButton, {flex: 1, backgroundColor: '#f1f5f9'}]} onPress={onClose}>
          <Text style={[styles.modalButtonText, {color: '#64748b'}]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modalButton, {flex: 1}]} onPress={onSubmit}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Submit</Text>}
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const EmployeeProfile = ({ userName, userRole, onLogout, isDarkMode }) => (
  <View style={[{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }, isDarkMode && { backgroundColor: '#0f172a' }]}>
    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
      <Text style={{ fontSize: 40, color: '#fff', fontWeight: 'bold' }}>{userName.charAt(0)}</Text>
    </View>
    <Text style={[{ fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 }, isDarkMode && { color: '#f8fafc' }]}>{userName}</Text>
    <Text style={{ fontSize: 16, color: '#64748b', marginBottom: 40, textTransform: 'uppercase', letterSpacing: 1 }}>{userRole.replace('_', ' ')}</Text>
    
    <TouchableOpacity onPress={onLogout} style={{ flexDirection: 'row', backgroundColor: '#ef4444', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16, alignItems: 'center', gap: 10 }}>
      <Feather name="log-out" size={20} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Log Out</Text>
    </TouchableOpacity>
  </View>
);

const EmployeeCalendar = ({ attendanceLoading, attendanceData, isDarkMode }) => {
  if (attendanceLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  
  const records = attendanceData?.myAttendance || [];
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  
  const presentPct = total > 0 ? (present / total) * 100 : 0;
  const absentPct = total > 0 ? (absent / total) * 100 : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={[{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 }, isDarkMode && { color: '#f8fafc' }]}>Attendance Overview</Text>
      
      <View style={[styles.card, isDarkMode && { backgroundColor: '#1e293b' }, { padding: 24, borderRadius: 24, marginBottom: 24 }]}>
        <Text style={[{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#1e293b' }, isDarkMode && { color: '#f8fafc' }]}>Last {total} Days</Text>
        
        {/* Simple Bar Chart */}
        <View style={{ flexDirection: 'row', height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', marginBottom: 20 }}>
          {presentPct > 0 && (
            <View style={{ width: `${presentPct}%`, backgroundColor: '#4ade80', justifyContent: 'center', alignItems: 'center' }}>
              {presentPct > 15 && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{Math.round(presentPct)}%</Text>}
            </View>
          )}
          {absentPct > 0 && (
            <View style={{ width: `${absentPct}%`, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' }}>
              {absentPct > 15 && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{Math.round(absentPct)}%</Text>}
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4ade80' }}>{present}</Text>
            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Present</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444' }}>{absent}</Text>
            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Absent</Text>
          </View>
        </View>
      </View>

      <Text style={[{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }, isDarkMode && { color: '#f8fafc' }]}>Recent Logs</Text>
      {records.slice(0, 10).map((r, i) => (
        <View key={i} style={[styles.card, isDarkMode && { backgroundColor: '#1e293b' }, { flexDirection: 'row', justifyContent: 'space-between', padding: 16, marginBottom: 10, borderRadius: 16 }]}>
          <View>
            <Text style={[{ fontSize: 14, fontWeight: 'bold', color: '#1e293b' }, isDarkMode && { color: '#f8fafc' }]}>{new Date(r.date).toLocaleDateString()}</Text>
            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '--:--'}</Text>
          </View>
          <View style={{ justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: r.status === 'present' ? '#4ade80' : '#ef4444' }}>
              {r.status.toUpperCase()}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

function DashboardScreen({ userRole, userName, onLogout }) {
  const isAdminOrHR = ['admin', 'hr', 'manager'].includes(userRole);
  const [showWebView, setShowWebView] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [authToken, setAuthToken] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Leave Request State
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState('sick');
  const [leaveReason, setLeaveReason] = useState('');
  
  // Basic date handling for demo
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 3);

  useEffect(() => {
    SecureStore.getItemAsync('accessToken').then(setAuthToken);
  }, []);

  const { data: statsData, loading: statsLoading } = useQuery(DASHBOARD_STATS_QUERY, { 
    skip: !isAdminOrHR || showWebView,
    fetchPolicy: 'network-only' 
  });
  
  const { data: tasksData, loading: tasksLoading, refetch: refetchTasks } = useQuery(MY_TASKS_QUERY, { 
    skip: isAdminOrHR || showWebView,
    fetchPolicy: 'network-only'
  });

  const { data: attendanceData, loading: attendanceLoading } = useQuery(MY_ATTENDANCE_QUERY, {
    skip: currentTab !== 'calendar',
    fetchPolicy: 'network-only'
  });

  const [updateTask] = useMutation(UPDATE_TASK_MUTATION);
  const [requestLeave, { loading: leavingLoading }] = useMutation(REQUEST_LEAVE_MUTATION);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userRole');
    await SecureStore.deleteItemAsync('userName');
    client.clearStore();
    onLogout();
  };

  const handleTaskStatusToggle = async (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : task.status === 'in_progress' ? 'completed' : 'in_progress';
    try {
      await updateTask({ variables: { id: task.id, input: { status: nextStatus } } });
      refetchTasks();
    } catch (e) {
      Alert.alert('Error', 'Could not update task status.');
    }
  };

  const handleLeaveSubmit = async () => {
    if (!leaveReason) return Alert.alert('Required', 'Please enter a reason for the leave.');
    try {
      await requestLeave({
        variables: {
          input: {
            type: leaveType,
            startDate: tomorrow.toISOString(),
            endDate: nextWeek.toISOString(),
            reason: leaveReason
          }
        }
      });
      setLeaveModalVisible(false);
      setLeaveReason('');
      Alert.alert('Success', 'Leave request submitted to HR.');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const renderWebView = (path) => {
    const injectedJs = `
      localStorage.setItem('accessToken', '${authToken}');
      window.location.href = '/${path}';
      true;
    `;
    return (
      <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 40 : 30, backgroundColor: isDarkMode ? '#0f172a' : '#f4f6f9' }}>
        <WebView 
          source={{ uri: process.env.EXPO_PUBLIC_WEB_URL || 'http://192.168.70.153:5173/' }}
          injectedJavaScriptBeforeContentLoaded={injectedJs}
          style={{ flex: 1 }}
        />
      </View>
    );
  };

  return (
    <View style={[styles.dashboardContainer, isDarkMode && { backgroundColor: '#0f172a' }]}>
      {currentTab === 'home' ? (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.welcomeText, { fontWeight: '400' }, isDarkMode && { color: '#f8fafc' }]}>Hello,</Text>
              <Text style={[styles.welcomeText, { fontSize: 28, marginTop: -4 }, isDarkMode && { color: '#f8fafc' }]}>{userName}</Text>
              <Text style={styles.roleBadge}>{userRole?.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={{ padding: 8 }}>
              <Feather name={isDarkMode ? "sun" : "moon"} size={28} color={isDarkMode ? "#fbbf24" : "#1a1a1a"} />
            </TouchableOpacity>
          </View>

          <AttendanceWidget onLogout={handleLogout} />

          {isAdminOrHR ? (
            <AdminCompanyOverview 
              statsLoading={statsLoading} 
              statsData={statsData} 
              onWebAccess={() => setCurrentTab('profile')} 
            />
          ) : (
            <>
              <EmployeePerformanceGraph tasksLoading={tasksLoading} tasksData={tasksData} />
              
              <EmployeeQuickActions onApplyLeave={() => setLeaveModalVisible(true)} />
              
              <EmployeeRecentTasks tasksLoading={tasksLoading} tasksData={tasksData} onTaskToggle={handleTaskStatusToggle} />

              <LeaveRequestModal 
                visible={leaveModalVisible} 
                onClose={() => setLeaveModalVisible(false)} 
                onSubmit={handleLeaveSubmit}
                leaveType={leaveType}
                setLeaveType={setLeaveType}
                leaveReason={leaveReason}
                setLeaveReason={setLeaveReason}
                loading={leavingLoading}
              />
            </>
          )}
        </ScrollView>
      ) : currentTab === 'tasks' ? renderWebView('tasks')
        : currentTab === 'calendar' ? <EmployeeCalendar attendanceData={attendanceData} attendanceLoading={attendanceLoading} isDarkMode={isDarkMode} />
        : <EmployeeProfile userName={userName} userRole={userRole} onLogout={handleLogout} isDarkMode={isDarkMode} />
      }

      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('home')}>
          <Feather name="home" size={24} color={currentTab === 'home' ? '#2196F3' : '#94a3b8'} />
          <Text style={[styles.tabText, currentTab === 'home' && { color: '#2196F3' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('tasks')}>
          <Feather name="list" size={24} color={currentTab === 'tasks' ? '#2196F3' : '#94a3b8'} />
          <Text style={[styles.tabText, currentTab === 'tasks' && { color: '#2196F3' }]}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('calendar')}>
          <Feather name="calendar" size={24} color={currentTab === 'calendar' ? '#2196F3' : '#94a3b8'} />
          <Text style={[styles.tabText, currentTab === 'calendar' && { color: '#2196F3' }]}>Leaves</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('profile')}>
          <Feather name="user" size={24} color={currentTab === 'profile' ? '#2196F3' : '#94a3b8'} />
          <Text style={[styles.tabText, currentTab === 'profile' && { color: '#2196F3' }]}>Web Panel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MainApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        const role = await SecureStore.getItemAsync('userRole');
        const name = await SecureStore.getItemAsync('userName');
        if (token) {
          setIsAuthenticated(true);
          setUserRole(role);
          setUserName(name);
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setIsInitializing(false);
      }
    };
    checkAuth();
  }, []);

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return isAuthenticated ? (
    <DashboardScreen userRole={userRole} userName={userName} onLogout={() => { setIsAuthenticated(false); setUserRole(null); setUserName(''); }} />
  ) : (
    <LoginScreen onLoginSuccess={(role, name) => { setIsAuthenticated(true); setUserRole(role); setUserName(name); }} />
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <MainApp />
    </ApolloProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loginBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 200,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButtonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  logoutTextSmall: {
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#fafcff', // Very light crisp tint as seen in image 2
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  roleBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  taskList: {
    marginTop: 10,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  taskTitle: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  taskStatus: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: 'bold',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: 20,
    fontStyle: 'italic',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFEbee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerRowWebView: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 16,
  },
  webAccessButton: {
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  webAccessText: {
    color: '#1d4ed8',
    fontWeight: 'bold',
    fontSize: 12,
  },
  quickActionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    marginRight: 16,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    alignItems: 'center',
  },
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 10,
    marginTop: 4,
    color: '#94a3b8',
    fontWeight: '600',
  }
});
