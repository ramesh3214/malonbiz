import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const Home = () => {
  const navigation = useNavigation();
  
  const titleAnim = useRef(new Animated.Value(0)).current; // Title fade and scale animation
  const buttonAnim = useRef(new Animated.Value(50)).current; // Button slide-up animation
  const buttonOpacity = useRef(new Animated.Value(0)).current; // Button fade-in animation

  useEffect(() => {
    // Title animation (fade in + scale)
    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Button animation (slide-up + fade-in)
    Animated.parallel([
      Animated.timing(buttonAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignIn = () => {
    navigation.navigate("Login");
  };

  return (
    <LinearGradient
    colors={["#121d23","#121d23", "#272528","#272528"]}// Gradient background
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#121d23" />
      <View style={styles.overlay}>
        {/* Animated Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            { opacity: titleAnim, transform: [{ scale: titleAnim }] },
          ]}
        >
          <Text style={styles.title}>
            Elevate Your Barber Business with Malon—Effortlessly Manage
            Appointments and Deliver Exceptional Customer Satisfaction!
          </Text>
        </Animated.View>

        {/* Animated Sign In Button */}
        <Animated.View
          style={[
            styles.signInButton,
            {
              transform: [{ translateY: buttonAnim }],
              opacity: buttonOpacity,
            },
          ]}
        >
          <TouchableOpacity onPress={handleSignIn} style={styles.buttonContent}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#fff"
              style={styles.lockIcon}
            />
            <Text style={styles.signInButtonText}>Tap to Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  titleContainer: {
    marginBottom: 200,
  },
  title: {
    fontSize: 40,
    fontFamily: "outfit-black",
    color: "#fff",
    textAlign: "left",
    lineHeight: 42,
  },
  signInButton: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
  
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  lockIcon: {
    marginRight: 10,
  },
  signInButtonText: {
    fontSize: 18,
    color: "#fff",
    fontFamily: "outfit-semibold",
  },
});

export default Home;
