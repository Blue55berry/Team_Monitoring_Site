import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import Modal from 'react-native-modal';
import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';
import { ApolloProvider, useMutation } from '@apollo/client/react';

const client = new ApolloClient({
  // Use EXPO_PUBLIC_API_URL or fallback to local IP
  link: new HttpLink({
    uri: process.env.EXPO_PUBLIC_API_URL || 'http://10.137.173.153:4000/graphql',
  }),
  cache: new InMemoryCache(),
});

const CHECK_IN_MUTATION = gql`
  mutation CheckIn($notes: String, $location: LocationInput) {
    checkIn(notes: $notes, location: $location) {
      id
      status
      checkIn
    }
  }
`;

function AttendanceScreen() {
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
        // Replace this with specific error code checks if your server provides them
        errorMessage = 'Failed to process check-in request with the server.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
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

export default function App() {
  return (
    <ApolloProvider client={client}>
      <AttendanceScreen />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 40,
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
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
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
