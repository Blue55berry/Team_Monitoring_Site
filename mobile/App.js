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
        if (data.login.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', data.login.refreshToken);
        }
        Alert.alert('Success', `Welcome back, ${data.login.user.firstName}!`);
        onLoginSuccess();
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
        // We only expose generic or known safe messages from our GraphQL server
        errorMessage = 'Failed to process check-in request with the server.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    client.clearStore(); // Clear apollo cache for security
    onLogout();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Employee Attendance</Text>

      <TouchableOpacity
        style={[styles.button, (loading || loadingLocation) && styles.buttonDisabled]}
        onPress={handleCheckIn}
        disabled={loading || loadingLocation}
      >
        {loading || loadingLocation ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Check In Now</Text>
        )}
      </TouchableOpacity>

      {/* Modern Pop Box Notification for Location Disabled */}
      <Modal
        isVisible={locationOffModal}
        animationIn="bounceIn"
        animationOut="bounceOut"
        backdropOpacity={0.6}
      >
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>📍</Text>
          </View>
          <Text style={styles.modalTitle}>Location Required</Text>
          <Text style={styles.modalText}>
            Please turn on your device's location services to verify your presence at the office.
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setLocationOffModal(false)}
          >
            <Text style={styles.modalButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function MainApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          setIsAuthenticated(true);
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
    <AttendanceScreen onLogout={() => setIsAuthenticated(false)} />
  ) : (
    <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
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
  logoutButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  logoutText: {
    color: '#d32f2f',
    fontWeight: 'bold',
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
});
