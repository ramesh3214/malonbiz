import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { firestore, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons'; // Make sure to install and import Ionicons

const History = () => {
  const [onlineServiceList, setOnlineServiceList] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [servedCount, setServedCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [newNotifications, setNewNotifications] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (user) {
          const barberRef = doc(firestore, "barbers", user.uid);
          const barberDoc = await getDoc(barberRef);

          if (barberDoc.exists()) {
            const barberData = barberDoc.data();
            const barberId = barberData?.barberId;

            if (barberId) {
              const ordersRef = collection(firestore, "orders");
              const q = query(ordersRef, where("saloonId", "==", barberId));

              const unsubscribe = onSnapshot(q, (snapshot) => {
                const onlineServices = [];
                let earnings = 0;
                let servedOrdersCount = 0;
                const newNotifications = [];
                const today = new Date().toDateString();

                snapshot.docs.forEach((doc) => {
                  const data = doc.data();
                  const service = { id: doc.id, ...data };
                  const appointmentDate = new Date(
                    service.appointmentDate
                  ).toDateString();

                  if (data.status === "served") {
                    servedOrdersCount += 1;
                    earnings += data.totalPrice;
                  } else if (data.bookingStatus === "cancelled") {
                    service.canceled = true;
                    onlineServices.push(service);
                  } else {
                    onlineServices.push(service);
                    newNotifications.push(service);
                  }
                });

                setOnlineServiceList(onlineServices);
                setTotalEarnings(earnings);
                setServedCount(servedOrdersCount);
                setNewNotifications(newNotifications);
              });

              return () => unsubscribe();
            } else {
              Alert.alert("Error", "Barber ID not found in barber data.");
            }
          } else {
            Alert.alert("Error", "Barber document not found.");
          }
        } else {
          Alert.alert("Error", "User not authenticated.");
        }
      } catch (error) {
        Alert.alert("Error", `Failed to fetch data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#FFCE54" />
      </TouchableOpacity>
      <Text style={styles.header}>History</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#FFCE54" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {onlineServiceList.length > 0 ? (
            onlineServiceList.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <Text style={styles.serviceText}>
                  Booking Number: {service.orderNumber || "N/A"}
                </Text>
                <Text style={styles.serviceText}>
                  Total Price: Rs.{service.totalPrice.toFixed(2) || "N/A"}
                </Text>
                <Text style={styles.serviceText}>
                  Appointment Date: {service.appointmentDate || "N/A"}
                </Text>
                <Text style={styles.serviceText2}>
                  Payment Mode: {service.paymentMethod || "N/A"}
                </Text>
                <Text style={styles.serviceText}>
                  Appointment Time: {service.appointmentTime || "N/A"}
                </Text>
                <Text style={styles.serviceText}>
                  Order Items:{" "}
                  {service.orderItems.map((item) => item.name).join(", ") ||
                    "N/A"}
                </Text>
                {service.canceled && (
                  <Text style={styles.canceledText}>Cancelled</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noRecords}>No records found</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: 25,
    left: 20,
    zIndex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFCE54",
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1, // Adds spacing between letters for a modern touch
  },
  serviceCard: {
    backgroundColor: "#121212", // Darker shade for card background
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5, // Add elevation for Android shadow effect
  },
  serviceText: {
    color: "#e0e0e0", // Lighter text color for better contrast
    fontSize: 16,
    marginBottom: 8,
  },
  serviceText2: {
    color: "#FFCE54",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  canceledText: {
    color: "#FF4D4D", // Slightly lighter red for better contrast
    fontWeight: "700",
    textAlign: "center",
    marginTop: 15,
  },
  noRecords: {
    color: "#FFCE54",
    textAlign: "center",
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
});

export default History;
