import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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
  mutation CheckIn($notes: String, $location: LocationInput) {
    checkIn(notes: $notes, location: $location) {
      id
      status
      checkIn
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

function AttendanceScreen({ onLogout }) {
  const [locationOffModal, setLocationOffModal] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [checkIn, { loading }] = useMutation(CHECK_IN_MUTATION);

  const handleCheckIn = async () => {
    setLoadingLocation(true);

    // Check if location services are enabled
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      setLoadingLocation(false);
      setLocationOffModal(true);
      return;
    }

    // Request permissions
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLoadingLocation(false);
      Alert.alert('Permission Denied', 'Permission to access location was denied');
      return;
    }

    try {
      // Get current location
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const userLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      // Call GraphQL Mutation
      const response = await checkIn({
        variables: {
          notes: "Mobile App Check-In",
          location: userLocation
        }
      });

      setLoadingLocation(false);

      if (response.data.checkIn.status === 'absent') {
        Alert.alert('Check In Failed', 'You are outside the required location area. Marked as absent.');
      } else {
        Alert.alert('Success', `Checked in successfully! Status: ${response.data.checkIn.status}`);
      }

    } catch (err) {
      setLoadingLocation(false);
      // Secure error handling to avoid leaking internal stack traces or server paths
      const isNetworkError = err.networkError;
      const isGraphQLError = err.graphQLErrors && err.graphQLErrors.length > 0;
      
      let errorMessage = 'An unexpected error occurred. Please try again later.';
      
      if (isNetworkError) {
        errorMessage = 'Network connection failed. Please check your internet and try again.';
      } else if (isGraphQLError) {
        // Expose the specific validation error (e.g. 'Employee record not found' or 'Already checked in')
        errorMessage = err.graphQLErrors[0]?.message || 'Failed to process check-in request with the server.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userRole');
    await SecureStore.deleteItemAsync('userName');
    client.clearStore(); // Clear apollo cache for security
    onLogout();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Daily Attendance</Text>
      <Text style={styles.cardSubtitle}>Mark your presence based on your GPS location.</Text>
      
      <TouchableOpacity
        style={[styles.button, (loading || loadingLocation) && styles.buttonDisabled]}
        onPress={handleCheckIn}
        disabled={loading || loadingLocation}
      >
        {loading || loadingLocation ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>📍 Check In Now</Text>
        )}
      </TouchableOpacity>

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

function DashboardScreen({ userRole, userName, onLogout }) {
  const isAdminOrHR = ['admin', 'hr', 'manager'].includes(userRole);
  const [showWebView, setShowWebView] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    SecureStore.getItemAsync('accessToken').then(setAuthToken);
  }, []);

  const { data: statsData, loading: statsLoading } = useQuery(DASHBOARD_STATS_QUERY, { 
    skip: !isAdminOrHR || showWebView,
    fetchPolicy: 'network-only' 
  });
  
  const { data: tasksData, loading: tasksLoading } = useQuery(MY_TASKS_QUERY, { 
    skip: isAdminOrHR || showWebView,
    fetchPolicy: 'network-only'
  });

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userRole');
    await SecureStore.deleteItemAsync('userName');
    client.clearStore();
    onLogout();
  };

  if (showWebView && isAdminOrHR) {
    const injectedJs = `
      localStorage.setItem('accessToken', '${authToken}');
      window.location.href = '/dashboard';
      true;
    `;

    return (
      <View style={{ flex: 1, paddingTop: 40, backgroundColor: '#f4f6f9' }}>
        <View style={styles.headerRowWebView}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowWebView(false)}>
            <Text style={styles.backButtonText}>← Back to Native App</Text>
          </TouchableOpacity>
        </View>
        <WebView 
          source={{ uri: process.env.EXPO_PUBLIC_WEB_URL || 'http://192.168.70.153:5173/' }}
          injectedJavaScriptBeforeContentLoaded={injectedJs}
          style={{ flex: 1 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.dashboardContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.welcomeText}>Hello, {userName}</Text>
          <Text style={styles.roleBadge}>{userRole?.toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButtonSmall} onPress={handleLogout}>
          <Text style={styles.logoutTextSmall}>Logout</Text>
        </TouchableOpacity>
      </View>

      <AttendanceScreen onLogout={handleLogout} />

      {isAdminOrHR ? (
        <View style={styles.card}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
            <Text style={styles.cardTitle}>Company Overview</Text>
            <TouchableOpacity onPress={() => setShowWebView(true)} style={styles.webAccessButton}>
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
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Pending Tasks</Text>
          {tasksLoading ? <ActivityIndicator /> : (
            <View style={styles.taskList}>
              {tasksData?.myTasks?.length > 0 ? (
                tasksData.myTasks.map(task => (
                  <View key={task.id} style={styles.taskItem}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskStatus}>{task.status.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>You have no pending tasks today!</Text>
              )}
            </View>
          )}
        </View>
      )}
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
    backgroundColor: '#f4f6f9',
    padding: 20,
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
  }
});
