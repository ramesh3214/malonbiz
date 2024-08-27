import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, BackHandler, Linking } from 'react-native';
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Initialize Firebase
const db = getFirestore();
const auth = getAuth();

const BarberProfile = ({ route, navigation }) => {
  const [barberData, setBarberData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');
  const [updatedAddress, setUpdatedAddress] = useState('');
  const [updatedBarberId, setUpdatedBarberId] = useState('');
  const [settingsDisabled, setSettingsDisabled] = useState(false);

  useEffect(() => {
    const checkUserAuthentication = async () => {
      const user = auth.currentUser;
      if (user) {
        fetchBarberData(user);
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    };

    const fetchBarberData = async (user) => {
      try {
        const cachedData = await AsyncStorage.getItem(`barberData_${user.uid}`);
        if (cachedData) {
          setBarberData(JSON.parse(cachedData));
        } else {
          const barberDocRef = doc(db, 'barbers', user.uid);
          const barberDoc = await getDoc(barberDocRef);
          if (barberDoc.exists()) {
            const data = barberDoc.data();
            setBarberData(data);
            await AsyncStorage.setItem(`barberData_${user.uid}`, JSON.stringify(data));
          } else {
            const newData = {
              name: user.displayName || 'Default Name',
              email: user.email || '',
              address: 'Default Address',
              barberId: '',
              profileUpdated: false,
            };
            await setDoc(barberDocRef, newData);
            setBarberData(newData);
            await AsyncStorage.setItem(`barberData_${user.uid}`, JSON.stringify(newData));
          }
        }
      } catch (error) {
        console.error("Error fetching barber data:", error);
      }
    };

    checkUserAuthentication();

    const backAction = () => {
      navigation.navigate('Dashboard');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await signOut(auth);
        await AsyncStorage.removeItem(`barberData_${user.uid}`);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    } catch (error) {
      console.error('Error signing out:', error.message);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleSaveChanges = async () => {
    try {
      const user = auth.currentUser;
      if (user && barberData) {
        const barberDocRef = doc(db, 'barbers', user.uid);

        const updatedData = {
          name: updatedName || barberData.name,
          email: updatedEmail || barberData.email,
          address: updatedAddress || barberData.address,
          barberId: updatedBarberId || barberData.barberId,
          profileUpdated: true,
        };

        await updateDoc(barberDocRef, updatedData);

        setBarberData(updatedData);
        await AsyncStorage.setItem(`barberData_${user.uid}`, JSON.stringify(updatedData));
        setSettingsDisabled(true); // Disable settings after saving
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error.message);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleContact = () => {
    const randomNumber = '7258866801'; // Replace with any random number
    Linking.openURL(`tel:${randomNumber}`);
  };

  const handleTermsAndConditions = () => {
    navigation.navigate('Term'); // Navigate to the Terms and Conditions page
  };

  const renderAvatar = () => {
    const placeholder = barberData && barberData.name
      ? barberData.name.charAt(0).toUpperCase()
      : 'M';
    return (
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{placeholder}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {renderAvatar()}
        <Text style={styles.title}>Welcome, {barberData?.name || 'Loading...'}</Text>
        <Text style={styles.email}>{barberData?.email || 'Loading...'}</Text>
      </View>
      {barberData ? (
        <View style={styles.boxContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.box}>
            <MaterialIcons name="book" size={24} color="#fff" />
            <Text style={styles.boxText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.box} onPress={handleContact}>
            <Ionicons name="call" size={24} color="#fff" />
            <Text style={styles.boxText}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.box} onPress={handleTermsAndConditions}>
            <FontAwesome5 name="file-contract" size={24} color="#fff" />
            <Text style={styles.boxText}>Terms & Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.box} onPress={() => navigation.navigate('History')} >
            <FontAwesome5 name="file-contract" size={24} color="#fff" />
            <Text style={styles.boxText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBox} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#000" />
            <Text style={styles.logoutBoxText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.loadingText}>Loading...</Text>
      )}
      {!barberData?.profileUpdated && !settingsDisabled && (
        <TouchableOpacity style={styles.settingsButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="settings" size={24} color="#fff" />
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={updatedName}
              onChangeText={setUpdatedName}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={updatedEmail}
              onChangeText={setUpdatedEmail}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Address"
              value={updatedAddress}
              onChangeText={setUpdatedAddress}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Barber ID"
              value={updatedBarberId}
              onChangeText={setUpdatedBarberId}
              placeholderTextColor="#666"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for a sleek look
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 50,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#222', // Slightly lighter black for avatar
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#444', // Subtle border for contrast
  },
  avatarText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#e0e0e0', // Light gray for contrast
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#e0e0e0', // Light gray for contrast
    textAlign: 'center',
    marginBottom: 10,
  },
  email: {
    fontSize: 18,
    color: '#b0b0b0', // Lighter gray for email
    textAlign: 'center',
    marginBottom: 20,
  },
  boxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  box: {
    backgroundColor: '#1a1a1a', // Darker box background
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', // Subtle shadow for elevation effect
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  boxText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 5,
  },
  logoutBox: {
    backgroundColor: '#FFCE54', // Red for logout
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  logoutBoxText: {
    color: '#000',
    fontSize: 18,
    marginTop: 5,
    fontWeight:'bold',
  },
  loadingText: {
    color: '#e0e0e0',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
  },
  settingsButton: {
    backgroundColor: '#1e90ff', // Blue for settings button
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  settingsText: {
    color: '#fff',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)', // Slightly darker overlay
  },
  modalContent: {
    backgroundColor: '#222', // Darker modal background
    borderRadius: 12,
    width: '80%',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    padding: 10,
    marginVertical: 10,
    fontSize: 16,
    color: '#e0e0e0', // Light text color
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#28a745', // Green for save button
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#dc3545', // Red for cancel button
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default BarberProfile;
