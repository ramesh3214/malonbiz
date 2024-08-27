import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
} from "react-native";
import { firestore, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

const OnlineBooking = () => {
  const [onlineServiceList, setOnlineServiceList] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true); // New state for loading
  const [servedCount, setServedCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [newNotifications, setNewNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Start loading
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
                    if (
                      filter === "all" ||
                      (filter === "today" && appointmentDate === today) ||
                      (filter === "tomorrow" &&
                        appointmentDate ===
                          new Date(
                            new Date().setDate(new Date().getDate() + 1)
                          ).toDateString())
                    ) {
                      onlineServices.push(service);
                      newNotifications.push(service);
                    }
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
        setLoading(false); // End loading
      }
    };

    const fetchStatus = async () => {
      try {
        setLoading(true); // Start loading

        const user = auth.currentUser;
        if (user) {
          const barberRef = doc(firestore, "barbers", user.uid);
          const barberDoc = await getDoc(barberRef);

          if (barberDoc.exists()) {
            const barberData = barberDoc.data();
            const barberStatus = barberData?.status || "off";
            setIsOpen(barberStatus === "open");
          } else {
            Alert.alert("Error", "Barber document not found.");
          }
        } else {
          Alert.alert("Error", "User not authenticated.");
        }
      } catch (error) {
        Alert.alert("Error", `Failed to fetch status: ${error.message}`);
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchData();
    fetchStatus();
  }, [navigation, filter]);

  const handleProfileClick = () => {
    navigation.navigate("Profile");
  };

  const handleOnline = () => {
    navigation.navigate("Dashboard");
  };

  const generateDocId = async () => {
    const onlineBookingRef = collection(firestore, "onlinebooking");
    const snapshot = await getDocs(onlineBookingRef);
    return snapshot.size + 1; // Incremental ID based on the size of the collection
  };

  const handleToggleOpen = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const barberRef = doc(firestore, "barbers", user.uid);
        const barberDoc = await getDoc(barberRef);

        if (barberDoc.exists()) {
          const barberData = barberDoc.data();
          const barberId = barberData?.barberId;

          if (barberId) {
            const newStatus = isOpen ? "closed" : "open";
            const saloonRef = doc(firestore, "saloons", barberId);
            await updateDoc(saloonRef, { open: newStatus });
            await updateDoc(barberRef, { status: newStatus });
            setIsOpen((prevState) => !prevState);
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
      Alert.alert("Error", `Failed to update status: ${error.message}`);
    }
  };

  const handleDone = async (serviceId) => {
    try {
      const serviceRef = doc(firestore, "orders", serviceId);
      const serviceDoc = await getDoc(serviceRef);

      if (serviceDoc.exists()) {
        const serviceData = serviceDoc.data();
        const docId = await generateDocId();

        // Move service to served list
        const servedService = { ...serviceData, status: "served" };

        await updateDoc(serviceRef, { status: "served" });
        await addDoc(collection(firestore, "onlinebooking"), {
          ...servedService,
          id: docId,
        });

        setOnlineServiceList((prevList) =>
          prevList.filter((service) => service.id !== serviceId)
        );
        setTotalEarnings(
          (prevEarnings) => prevEarnings + servedService.totalPrice
        );
        setServedCount((prevCount) => prevCount + 1);
        setNewNotifications((prevNotifications) =>
          prevNotifications.filter((service) => service.id !== serviceId)
        );
      } else {
        Alert.alert("Error", "Service document not found.");
      }
    } catch (error) {
      Alert.alert("Error", `Failed to mark service as done: ${error.message}`);
    }
  };

  const handleRemoveCanceled = async (serviceId) => {
    try {
      await deleteDoc(doc(firestore, "orders", serviceId));
      setOnlineServiceList((prevList) =>
        prevList.filter((service) => service.id !== serviceId)
      );
      Alert.alert("Success", "Canceled order removed successfully.");
    } catch (error) {
      Alert.alert("Error", `Failed to remove canceled order: ${error.message}`);
    }
  };

  const handleNotificationClick = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setNewNotifications([]); // Clear notifications once they are viewed
  };

  

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FFCE54" />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.profileIcon}
              onPress={handleProfileClick}
            >
              <Ionicons name="person-circle" size={40} color="#FFCE54" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notificationIcon}
              onPress={handleNotificationClick}
            >
              <Ionicons
                name="notifications-outline"
                size={30}
                color="#FFCE54"
              />
              {newNotifications.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {newNotifications.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.onlineButton} onPress={handleOnline}>
            <Text style={styles.onlineButtonText}>Track Offline</Text>
          </TouchableOpacity>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filter}
              style={styles.picker}
              onValueChange={(itemValue) => setFilter(itemValue)}
            >
              
              <Picker.Item label="Today" value="today" />
              <Picker.Item label="Tomorrow" value="tomorrow" />
            </Picker>
          </View>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              Status: {isOpen ? "Open" : "Closed"}
            </Text>
            <Switch
              value={isOpen}
              onValueChange={handleToggleOpen}
              thumbColor={isOpen ? "#FFCE54" : "#888"}
              trackColor={{ false: "#555", true: "#FFCE54" }}
            />
          </View>

          <ScrollView style={styles.scrollContainer}>
            <View style={styles.rowContainer}>
              <View style={styles.box}>
                <FontAwesome5 name="book" size={40} color="#000" />
                <Text style={styles.boxCount}>{onlineServiceList.length}</Text>
                <Text style={styles.boxTitle}>Current bookings</Text>
              </View>
              <View style={styles.box}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={30}
                  color="#000"
                />
                <Text style={styles.boxCount}>{servedCount}</Text>
                <Text style={styles.boxTitle}>Served bookings</Text>
              </View>

              
              <View style={styles.box}>
                <Ionicons name="wallet-outline" size={30} color="#000" />
                <Text style={styles.boxCount}>
                  Rs.{totalEarnings.toFixed(2)}
                </Text>
                <Text style={styles.boxTitle}>Total Earnings</Text>
              </View>
            </View>

            
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>New Bookings</Text>
              {onlineServiceList.length > 0 &&
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
                      Payment Mode: "{service.paymentMethod || "N/A"}"
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
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveCanceled(service.id)}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}

                    {service.canceled ? (
                      <Text style={styles.canceledText}>Cancelled</Text>
                    ) : (
                      <TouchableOpacity
                        style={styles.doneButton}
                        onPress={() => handleDone(service.id)}
                      >
                        <Text style={styles.doneButtonText}>Mark as Done</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
            </View>
          </ScrollView>

          {/* Modal for new booking notifications */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCloseModal}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>New Bookings</Text>
                {newNotifications.length > 0 ? (
                  newNotifications.map((notification) => (
                    <View key={notification.id} style={styles.notificationItem}>
                      <Text style={styles.notificationText}>
                        Order Number: {notification.orderNumber}
                      </Text>
                      <Text style={styles.notificationText}>
                        Appointment Date: {notification.appointmentDate}
                      </Text>
                      <Text style={styles.notificationText}>
                        Appointment Time: {notification.appointmentTime}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: "#fff" }}>No new notifications</Text>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Dark background for contrast
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20, // Added margin for spacing
  },
  notificationIcon: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FFCE54",
    borderRadius: 10,
    width: 24, // Increased size for better visibility
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 12, // Adjusted for better fit
  },
  profileIcon: {
    // Styles for the profile icon can be customized here
  },
  removeButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30, // Rounded edges for a modern look
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  removeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },

  downloadButton: {
    backgroundColor: "#FFCE54",
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  downloadButtonText: {
    color: "#000",
    fontWeight: "bold",
  },

  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  toggleText: {
    flex: 1,
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600", // Slightly bolder text
  },
  onlineButton: {
    backgroundColor: "#FFCE54",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  onlineButtonText: {
    fontSize: 18,
    fontWeight: "700", // Bolder text for emphasis
    color: "#000",
  },
  pickerContainer: {
    marginBottom: 15,
  },
  picker: {
    color: "#FFCE54",
  },
  scrollContainer: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10, // Added vertical spacing
  },
  box: {
    backgroundColor: "#FFCE54",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 7, // Increased margin for spacing
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  boxCount: {
    fontSize: 22,
    fontWeight: "700", // Bolder text for better emphasis
    color: "#000",
  },
  boxTitle: {
    fontSize: 16,
    color: "#000",
  },
  listContainer: {
    marginTop: 25,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "700", // Bolder text for better visibility
    color: "#FFCE54",
    marginBottom: 15,
  },
  serviceCard: {
    backgroundColor: "#1e1e1e", // Slightly lighter dark background
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  serviceText: {
    color: "#FFCE54",
    fontSize: 16, // Slightly larger text for readability
    marginBottom: 10,
  },
  serviceText2: {
    color: "#FFCE54",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  doneButton: {
    backgroundColor: "#FFCE54",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  doneButtonText: {
    color: "#000",
    fontWeight: "700", // Bolder text for emphasis
  },
  canceledText: {
    color: "#FF0000",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Darker overlay for contrast
  },
  modalContent: {
    backgroundColor: "#1e1e1e",
    padding: 25,
    borderRadius: 12,
    width: "85%",
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFCE54",
    marginBottom: 15,
  },
  notificationItem: {
    marginBottom: 15, // Increased margin for spacing
  },
  notificationText: {
    color: "#FFCE54",
    fontSize: 16,
  },
  noNotifications: {
    color: "#FFCE54",
    textAlign: "center",
    fontSize: 16, // Increased font size for better readability
  },
  closeButtonText: {
    color: "#FFCE54",
    fontSize: 16, // Increased font size for readability
  },
});

export default OnlineBooking;
