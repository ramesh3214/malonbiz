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
      navigation.navigate('Profile');
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
    const randomNumber = '+1234567890'; // Replace with any random number
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
          <TouchableOpacity onPress={() => navigation.navigate('Online')} style={styles.box}>
            <MaterialIcons name="book" size={24} color="#444" />
            <Text style={styles.boxText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.box} onPress={handleContact}>
            <Ionicons name="call" size={24} color="#444" />
            <Text style={styles.boxText}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.box} onPress={handleTermsAndConditions}>
            <FontAwesome5 name="file-contract" size={24} color="#444" />
            <Text style={styles.boxText}>Terms & Conditions</Text>
          </TouchableOpacity>
        
          <TouchableOpacity style={styles.logoutBox} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutBoxText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.loadingText}>Loading...</Text>
      )}
      {!barberData?.profileUpdated && !settingsDisabled && (
        <TouchableOpacity style={styles.settingsButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="settings" size={24} color="#444" />
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
    backgroundColor: '#fafafa', // Light background for a cleaner look
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 40,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#f0f0f0', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#d1d1d1',
  },
  avatarText: {
    fontSize: 48,
    fontFamily: 'outfit-bold',
    color: '#444', // Slightly darker gray for a modern contrast
  },
  title: {
    fontSize: 24,
    fontFamily: 'outfit-semibold',
    color: '#111', // Darker shade for better readability
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontFamily: 'outfit-regular',
    color: '#777', 
    textAlign: 'center',
    marginBottom: 20,
  },
  boxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  box: {
    backgroundColor: '#ffffff', // White boxes for a clean appearance
    borderRadius: 15,
    padding: 20,
    width: '48%',
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ddd', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5, // For Android shadow support
  },
  boxText: {
    color: '#222',
    fontSize: 16,
    fontFamily: 'outfit-medium',
    marginTop: 10,
  },
  logoutBox: {
    backgroundColor: '#00A3AD', // Soft highlight for logout
    borderRadius: 15,
    padding: 18,
    width: '48%',
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ddd',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutBoxText: {
    color: '#fff', // Use red for emphasis
    fontSize: 18,
    fontFamily: 'outfit-semibold',
    marginTop: 10,
  },
  loadingText: {
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'outfit-medium',
  },
  settingsButton: {
    backgroundColor: '#007bff', // Zomato-style blue for buttons
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    shadowColor: '#ddd',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  settingsText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'outfit-semibold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for contrast
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '85%',
    padding: 25,
    alignItems: 'center',
    shadowColor: '#ddd',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'outfit-bold',
    color: '#111',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc', 
    padding: 12,
    marginVertical: 15,
    fontSize: 16,
    fontFamily: 'outfit-regular',
    color: '#444',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#28a745',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'outfit-semibold',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'outfit-semibold',
  },
});

export default BarberProfile;
