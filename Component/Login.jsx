import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useAuth } from "./firebaseauth"; // Adjust the path as needed
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const Login = ({ navigation }) => {
  const { login } = useAuth(); // Use the correct hook here
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false); // State to manage loading indicator

  useEffect(() => {
    const checkCachedUser = async () => {
      const cachedUser = await AsyncStorage.getItem("user");
      if (cachedUser) {
        navigation.navigate("Profile"); // Navigate if user is cached
      }
    };

    checkCachedUser();
  }, [navigation]);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true); // Show loading indicator
    setErrorMessage(""); // Reset error message

    try {
      await login(email, password);
      navigation.navigate("Profile"); // Navigate to the profile screen after successful login
    } catch (error) {
      setErrorMessage("Invalid username or password");
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  return (
   
      <View style={styles.cardContainer}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>
          Your Gateway to Exceptional Grooming Services
        </Text>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address*</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Your Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
          <Text style={styles.label}>Password*</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Your Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
  
  );
};

const styles = StyleSheet.create({
  
  cardContainer: {
    backgroundColor:"rgba(255, 255, 255, 0.9)", // Semi-transparent white background
    borderRadius: 15,
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
    padding: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,

  },
  title: {
    fontSize: 28,
    fontFamily: "outfit-bold",
    color: "#00A3AD",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "outfit-regular",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  errorText: {
    color: "#d9534f",
    marginBottom: 15,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "outfit-regular",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: "#444",
    marginBottom: 5,
    fontSize: 14,
    fontFamily: "outfit-semibold",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    color: "#333",
    fontSize: 16,
    fontFamily: "outfit-regular",
  },
  button: {
    backgroundColor: "#00A3AD",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "outfit-semibold",
  },
});

export default Login;
