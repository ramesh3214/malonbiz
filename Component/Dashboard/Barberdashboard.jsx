import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Modal, Button } from 'react-native';
import { firestore, auth } from '../firebaseConfig'; // Ensure correct import path
import { doc, setDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const BarberDashboard = () => {
  const [currentBookings, setCurrentBookings] = useState(0);
  const [totalServed, setTotalServed] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [offlineServiceList, setOfflineServiceList] = useState([]);
  const [offlineEntryVisible, setOfflineEntryVisible] = useState(false);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookingTime, setBookingTime] = useState(new Date().toLocaleTimeString());
  const [timeTaken, setTimeTaken] = useState('');
  const [offlineUserName, setOfflineUserName] = useState('');
  const [offlineServiceName, setOfflineServiceName] = useState('');
  const [offlinePrice, setOfflinePrice] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [barberId, setBarberId] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    const fetchBarberId = async () => {
      const user = auth.currentUser;
      if (user) {
        const barberDoc = await getDoc(doc(firestore, 'barbers', user.uid));
        if (barberDoc.exists()) {
          const barberData = barberDoc.data();
          setBarberId(barberData.barberId);
        } else {
          console.error('No such document in barbers collection');
        }
      }
    };

    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(firestore, 'offlineBookings', user.uid);

        const unsubscribe = onSnapshot(userRef, (doc) => {
          const data = doc.data();
          if (data) {
            const bookings = data.bookings || {};
            let currentBookingsCount = 0;
            let totalServedCount = 0;
            let totalEarningsAmount = 0;
            const serviceList = [];

            for (const [id, booking] of Object.entries(bookings)) {
              if (booking.status === 'current offline') {
                currentBookingsCount++;
                serviceList.push({ id, ...booking });
              } else if (booking.status === 'served offline') {
                totalServedCount++;
                totalEarningsAmount += booking.price;
              }
            }

            setCurrentBookings(currentBookingsCount);
            setTotalServed(totalServedCount);
            setTotalEarnings(totalEarningsAmount);
            setOfflineServiceList(serviceList);
          }
        });

        return () => unsubscribe(); // Cleanup subscription on unmount
      }
    };

    fetchBarberId();
    fetchData();

    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setBookingTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, [navigation, barberId]);

  const calculateEndTime = (time, timeTaken) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + parseInt(timeTaken, 10);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleOfflineEntry = async () => {
    if (!offlineUserName || !offlineServiceName || !offlinePrice || !timeTaken) {
      Alert.alert('Error', 'Please fill all fields before saving');
      return;
    }
    try {
      const user = auth.currentUser;
      if (user && barberId) {
        const endTime = calculateEndTime(bookingTime, timeTaken);
        const newBookingId = Date.now().toString(); // Unique ID based on timestamp
        const newBookingData = {
          barberId: barberId,
          username: offlineUserName,
          serviceName: offlineServiceName,
          price: parseFloat(offlinePrice),
          time: bookingTime,
          date: bookingDate.toISOString().split('T')[0],
          status: 'current offline',
          timeTaken: timeTaken,
          endTime: endTime,
        };

        const userDocRef = doc(firestore, 'offlineBookings', user.uid);
        const docSnapshot = await getDoc(userDocRef);
        
        if (docSnapshot.exists()) {
          await updateDoc(userDocRef, {
            [`bookings.${newBookingId}`]: newBookingData
          });
        } else {
          await setDoc(userDocRef, {
            bookings: {
              [newBookingId]: newBookingData
            }
          });
        }
        
        setOfflineEntryVisible(false);
        Alert.alert('Success', 'Offline entry saved successfully');
        // Clear inputs
        setBookingDate(new Date());
        setBookingTime(new Date().toLocaleTimeString());
        setTimeTaken('');
        setOfflineUserName('');
        setOfflineServiceName('');
        setOfflinePrice('');
      }
    } catch (error) {
      console.error('Error saving offline entry:', error.message);
      Alert.alert('Error', 'Failed to save offline entry');
    }
  };

  const handleOfflineDone = async (serviceId) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(firestore, 'offlineBookings', user.uid);
        await updateDoc(userRef, {
          [`bookings.${serviceId}.status`]: 'served offline'
        });
        // No need to manually update state here since onSnapshot will handle it
      }
    } catch (error) {
      console.error('Error updating offline service status:', error.message);
      Alert.alert('Error', 'Failed to update offline service status');
    }
  };

  const handleProfileClick = () => {
    navigation.navigate('Profile');
  };

  const handleOnline = () => {
    navigation.navigate('Online');
  };

  const isButtonEnabled = (endTime) => {
    const now = new Date();
    const [endHours, endMinutes, endSeconds] = endTime.split(':').map(Number);
    const endDateTime = new Date();
    endDateTime.setHours(endHours, endMinutes, endSeconds, 0);
    return now >= endDateTime;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileIcon} onPress={handleProfileClick}>
          <Ionicons name="person-circle" size={40} color="#FFCE54" />
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <TouchableOpacity style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={30} color="#FFCE54" />
          </TouchableOpacity>
        </View>
      </View>
      <View>
        <TouchableOpacity onPress={handleOnline} style={styles.onlineButton}>
          <Text style={styles.onlineButtonText}>Track Online</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.dashboardContainer}>
          <View style={styles.dashboardBox}>
            <FontAwesome5 name="book" size={40} color="#000" />
            <Text style={styles.dashboardCount}>{currentBookings}</Text>
            <Text style={styles.dashboardLabel}>Current bookings</Text>
          </View>
          <View style={styles.dashboardBox}>
            <Ionicons name="checkmark-done-outline" size={40} color="#000" />
            <Text style={styles.dashboardCount}>{totalServed}</Text>
            <Text style={styles.dashboardLabel}> Served bookings</Text>
          </View>
          <View style={styles.dashboardBox}>
            <Ionicons name="wallet-outline" size={40} color="#000" />
            <Text style={styles.dashboardCount}>Rs.{totalEarnings.toFixed(2)}</Text>
            <Text style={styles.dashboardLabel}>Total  Earnings</Text>
          </View>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Offline Service List</Text>
          {offlineServiceList.length > 0 ? (
            offlineServiceList.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <Text style={styles.serviceText}>User: {service.username}</Text>
                <Text style={styles.serviceText}>Service: {service.serviceName}</Text>
                <Text style={styles.serviceText}>Price: Rs.{service.price}</Text>
                <Text style={styles.serviceText}>Booking Time: {service.time}</Text>
                <Text style={styles.serviceText}>Booking Date: {service.date}</Text>
                <Text style={styles.serviceText}>End Time: {service.endTime}</Text>
                <TouchableOpacity
                  style={[
                    styles.doneButton,
                    { backgroundColor: isButtonEnabled(service.endTime) ? '#32CD32' : '#555' }
                  ]}
                  onPress={() => handleOfflineDone(service.id)}
                  disabled={!isButtonEnabled(service.endTime)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noServicesText}>No offline services at the moment</Text>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setOfflineEntryVisible(true)}
      >
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={offlineEntryVisible}
        onRequestClose={() => setOfflineEntryVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Offline Service Entry</Text>
            <TextInput
              style={styles.input}
              placeholder="User Name"
              placeholderTextColor="#888"
              value={offlineUserName}
              onChangeText={setOfflineUserName}
            />
            <TextInput
              style={styles.input}
              placeholder="Service Name"
              placeholderTextColor="#888"
              value={offlineServiceName}
              onChangeText={setOfflineServiceName}
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              placeholderTextColor="#888"
              value={offlinePrice}
              onChangeText={setOfflinePrice}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Time Taken (in minutes)"
              placeholderTextColor="#888"
              value={timeTaken}
              onChangeText={setTimeTaken}
              keyboardType="numeric"
            />
            <View style={styles.modalButtonRow}>
              <Button title="Cancel" onPress={() => setOfflineEntryVisible(false)} color="#888" />
              <Button title="Save" onPress={handleOfflineEntry} color="#FFCE54" />
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
    backgroundColor: '#000', // Changed background color to black
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileIcon: {
    marginLeft: -10,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    marginLeft: 10,
  },
  onlineButton: {
    backgroundColor: '#FFCE54',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30, // Rounded edges for a modern look
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, // Slightly stronger shadow for depth
    shadowRadius: 6,
    elevation: 5,
  },
  onlineButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000', // Black text
  },
  scrollContainer: {
    flex: 1,
  },
  dashboardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dashboardBox: {
    backgroundColor: '#FFCE54',
    borderRadius: 15, // Slightly larger radius for a more modern look
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  dashboardCount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  dashboardLabel: {
    fontSize: 16,
    color: '#000', // Bright color for consistency
    fontWeight: '500',
  },
  listContainer: {
    backgroundColor: '#0d0d0d',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  listTitle: {
    color: '#FFCE54',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  serviceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  serviceText: {
    color: '#ccc',
    marginBottom: 10,
  },
  doneButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FFCE54',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  doneButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  noServicesText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 25,
  },
  addButton: {
    backgroundColor: '#FFCE54',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    right: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalView: {
    backgroundColor: '#0d0d0d',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    color: '#FFCE54',
    fontWeight: '700',
    marginBottom: 20,
  },
  input: {
    height: 45,
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    color: 'white',
    width: '100%',
    marginBottom: 15,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    color: '#FFCE54',
    fontSize: 16,
  },
});

export default BarberDashboard;