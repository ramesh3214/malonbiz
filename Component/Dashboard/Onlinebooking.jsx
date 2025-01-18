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
import { Linking ,StatusBar} from "react-native";

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

        // Get the current authenticated user
        const user = auth.currentUser;
        if (user) {
          const barberRef = doc(firestore, "barbers", user.uid);
          const barberDoc = await getDoc(barberRef);

          if (barberDoc.exists()) {
            const barberData = barberDoc.data();
            const barberId = barberData?.barberId; // Assuming barberId is the salonId

            if (barberId) {
              // Add the salonId (barberId) to the online booking document
              const servedService = {
                ...serviceData,
                status: "served",
                salonId: barberId,
              };

              await updateDoc(serviceRef, { status: "served" });

              // Add new document to onlinebooking collection with salonId
              await addDoc(
                collection(firestore, "onlinebooking"),
                servedService
              );

              setOnlineServiceList((prevList) =>
                prevList.filter((service) => service.id !== serviceId)
              );
              setTotalEarnings((prevEarnings) => prevEarnings);
              setServedCount((prevCount) => prevCount);
              setNewNotifications((prevNotifications) =>
                prevNotifications.filter((service) => service.id !== serviceId)
              );
            } else {
              Alert.alert("Error", "Barber ID not found.");
            }
          } else {
            Alert.alert("Error", "Barber document not found.");
          }
        } else {
          Alert.alert("Error", "User not authenticated.");
        }
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
       <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      {loading ? (
        <ActivityIndicator size="large" color="#00A3AD" />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.profileIcon}
              onPress={handleProfileClick}
            >
              <Ionicons name="person-circle" size={40} color="#00A3AD" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notificationIcon}
              onPress={handleNotificationClick}
            >
              <Ionicons
                name="notifications-outline"
                size={30}
                color="#00A3AD"
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
          <TouchableOpacity>
            <Text style={styles.onlineButtonText}>Online</Text>
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
              thumbColor={isOpen ? "#00A3AD" : "#888"}
              trackColor={{ false: "#555", true: "#00A3AD" }}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false} // Hides vertical scrollbar
            showsHorizontalScrollIndicator={false}
            style={styles.scrollContainer}
          >
            <View style={styles.rowContainer}>
              <View style={styles.box}>
                <FontAwesome5 name="book" size={40} color="#fff" />
                <Text style={styles.boxCount}>{onlineServiceList.length}</Text>
                <Text style={styles.boxTitle}>Current bookings</Text>
              </View>
              <View style={styles.box}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={30}
                  color="#fff"
                />
                <Text style={styles.boxCount}>{servedCount}</Text>
                <Text style={styles.boxTitle}>Served bookings</Text>
              </View>

              <View style={styles.box}>
                <Ionicons name="wallet-outline" size={30} color="#fff" />
                <Text style={styles.boxCount}>
                  Rs.{totalEarnings.toFixed(2)}
                </Text>
                <Text style={styles.boxTitle}>Total Earnings</Text>
              </View>
            </View>

            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>New Bookings</Text>
              {onlineServiceList.length > 0 &&
                onlineServiceList.map((service) => {
                  const openDialPad = () => {
                    Linking.openURL(`tel:${service.phoneNumber}`).catch(() =>
                      Alert.alert(
                        "Error",
                        "Unable to make a call at the moment."
                      )
                    );
                  };
                  // Extract appointment time outside the JSX block
                  const appointmentTime = service.appointmentTime
                    ? Object.values(service.appointmentTime)[0]
                    : "N/A";

                  return (
                    <View key={service.id} style={styles.serviceCard}>
                      <Text style={styles.serviceText2}>
                        {service.salons || "N/A"}
                      </Text>
                      <Text style={styles.serviceText}>
                        Booking Number: {service.orderNumber || "N/A"}
                      </Text>
                      <Text style={styles.serviceText}>
                        Total Price: Rs.
                        {service.totalPrice
                          ? service.totalPrice.toFixed(2)
                          : "N/A"}
                      </Text>
                      <Text style={styles.serviceText}>
                        Appointment Date: {service.appointmentDate || "N/A"}
                      </Text>
                      <Text style={styles.serviceText2}>
                        Payment Mode: {service.paymentMethod || "N/A"}
                      </Text>
                      <Text style={styles.serviceText}>
                        Appointment Time: {appointmentTime}
                      </Text>

                      <Text style={styles.serviceText}>
                        Order Items:{" "}
                        {service.orderItems.length > 0
                          ? service.orderItems
                              .map((item) => item.name)
                              .join(", ")
                          : "N/A"}
                      </Text>

                      <View style={styles.cardContainer}>
                        <Text style={styles.phoneNumberText}>
                          Phone Number: {service.phoneNumber}
                        </Text>
                        <TouchableOpacity
                          style={styles.callButton}
                          onPress={openDialPad} // Call openDialPad when pressed
                        >
                          <Ionicons name="call" size={20} color="#fff" />
                          <Text style={styles.callButtonText}>Call</Text>
                        </TouchableOpacity>
                      </View>
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
                          <Text style={styles.doneButtonText}>
                            Mark as Done
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
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
                  newNotifications.map((notification) => {
                    const appointmentTime = notification.appointmentTime
                      ? Object.values(notification.appointmentTime)[0]
                      : "N/A";

                    return (
                      <View
                        key={notification.id}
                        style={styles.notificationItem}
                      >
                        <Text style={styles.notificationText}>
                          Order Number: {notification.orderNumber}
                        </Text>
                        <Text style={styles.notificationText}>
                          Appointment Date: {notification.appointmentDate}
                        </Text>
                        <Text style={styles.notificationText}>
                          Appointment Time: {appointmentTime}
                        </Text>
                      </View>
                    );
                  })
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
    backgroundColor: "#fff", // Lighter clean background for a fresh look
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  notificationIcon: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4757", // More vibrant notification color
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff", // White text on badge for contrast
    fontFamily: "outfit-bold",
    fontSize: 12,
    textTransform: "lowercase",
  },
  profileIcon: {
    // Add styles if needed
  },
  removeButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  removeButtonText: {
    color: "#FFF",
    fontFamily: "outfit-bold",
    textTransform: "lowercase",
  },
  downloadButton: {
    backgroundColor: "#00A3AD", // Keeping the consistent yellow theme
    padding: 12,
    borderRadius: 30,
    marginBottom: 8,
    shadowColor: "#444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  downloadButtonText: {
    color: "#444",
    fontFamily: "outfit-semibold",
    textTransform: "lowercase",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  toggleText: {
    flex: 1,
    color: "#333",
    fontSize: 18,
    fontFamily: "outfit-medium",
    textTransform: "lowercase",
  },

  onlineButtonText: {
    fontSize: 16,
    fontFamily: "outfit-semibold",
    paddingVertical: 15,
    color: "#00A3AD",
    textTransform: "capitalize",
  },
  pickerContainer: {
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  picker: {
    color: "#00A3AD",
    fontFamily: "outfit-semibold",
  },
  scrollContainer: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  box: {
    backgroundColor: "#00A3AD",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 7,
    shadowColor: "#444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  boxCount: {
    fontSize: 16,
    fontFamily: "outfit-regular",
    color: "#fff",
    textTransform: "lowercase",
  },
  boxTitle: {
    fontSize: 15,
    fontFamily: "outfit-regular",
    color: "#fff",
    textTransform: "lowercase",
  },
  listContainer: {
    marginTop: 25,
  },
  listTitle: {
    fontSize: 17,
    fontFamily: "outfit-bold",
    color: "#00A3AD",
    marginBottom: 15,
    textTransform: "lowercase",
  },
  serviceCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: "#444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceText: {
    color: "#333",
    fontSize: 16,
    fontFamily: "outfit-regular",
  },
  serviceText2: {
    color: "#00A3AD",
    fontSize: 16,
    fontFamily: "outfit-bold",

    textTransform: "lowercase",
  },
  cardContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: "#444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row', // Aligns phone number and call button horizontally
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneNumberText: {
    fontSize: 16,
    fontFamily: "outfit-regular",
    color: "#333",
    flex: 1, // Takes remaining space
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#00A3AD", // Button background color
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30,
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  callButtonText: {
    color: "#fff",
    fontFamily: "outfit-bold",
    fontSize: 16,
    marginLeft: 8, // Space between icon and text
  },
  doneButton: {
    backgroundColor: "#00A3AD",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  doneButtonText: {
    color: "#fff",
    fontFamily: "outfit-bold",
    textTransform: "lowercase",
  },
  canceledText: {
    color: "#ff0000",
    fontFamily: "outfit-semibold",
    textAlign: "center",
    marginTop: 15,
    textTransform: "lowercase",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent overlay
  },
  modalContent: {
    backgroundColor: "#ffffff",
    padding: 25,
    borderRadius: 12,
    width: "85%",
    shadowColor: "#444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "outfit-bold",
    color: "#00A3AD",
    marginBottom: 15,
    textTransform: "lowercase",
  },
  notificationItem: {
    marginBottom: 15,
  },
  notificationText: {
    color: "#333",
    fontSize: 16,
    fontFamily: "outfit-regular",
  },
  noNotifications: {
    color: "#333",
    textAlign: "center",
    fontSize: 16,
    fontFamily: "outfit-regular",
  },
  closeButtonText: {
    color: "#00A3AD",
    fontSize: 16,
    fontFamily: "outfit-medium",
    textTransform: "lowercase",
  },
});

export default OnlineBooking;
