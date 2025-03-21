import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// Register for the authentication callback
WebBrowser.maybeCompleteAuthSession();

// Replace with your actual Google client ID
const CLIENT_ID =
  "122725482850-32ij9ll2vcgnhv587ktnj5ljjssr3n09.apps.googleusercontent.com";

// Theme colors based on the provided palette
const THEME = {
  primary: "#7C4DFF", // Purple
  dark: "#212121", // Dark Gray/Black
  accent: "#FFFF00", // Yellow
  light: "#E0E0E0", // Light Gray
};

export default function GoogleAuth({ onAuthStateChange }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Configure the Google authentication request
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: CLIENT_ID,
    iosClientId: CLIENT_ID,
    androidClientId: CLIENT_ID,
    webClientId: CLIENT_ID,
  });

  useEffect(() => {
    // Check if user is already logged in
    checkLocalUser();
  }, []);

  useEffect(() => {
    // Handle authentication response
    handleAuthResponse();
  }, [response]);

  const checkLocalUser = async () => {
    try {
      const userJSON = await AsyncStorage.getItem("user");
      if (userJSON) {
        const userData = JSON.parse(userJSON);
        setUserInfo(userData);
        onAuthStateChange && onAuthStateChange(userData);
      }
    } catch (error) {
      console.error("Error retrieving stored user:", error);
    }
  };

  const handleAuthResponse = async () => {
    if (response?.type === "success") {
      setLoading(true);
      // Exchange the auth code for a token
      const { authentication } = response;

      try {
        // Get user info with the access token
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/userinfo/v2/me",
          {
            headers: { Authorization: `Bearer ${authentication.accessToken}` },
          }
        );

        const userData = await userInfoResponse.json();
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        setUserInfo(userData);
        onAuthStateChange && onAuthStateChange(userData);
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogin = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error("Failed to log in:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      setUserInfo(null);
      onAuthStateChange && onAuthStateChange(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <View style={styles.container}>
      {userInfo ? (
        // Logged in state
        <View style={styles.profileContainer}>
          <Text style={styles.welcomeText}>Welcome, {userInfo.name}!</Text>
          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Logged out state
        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleLogin}
          disabled={loading || !request}
        >
          <Ionicons
            name="logo-google"
            size={24}
            color={THEME.light}
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>
            {loading ? "Signing in..." : "Sign in with Google"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  profileContainer: {
    alignItems: "center",
    width: "100%",
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 20,
    color: THEME.dark,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginVertical: 10,
  },
  googleButton: {
    backgroundColor: THEME.primary,
  },
  logoutButton: {
    backgroundColor: THEME.dark,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: THEME.light,
    fontSize: 16,
    fontWeight: "600",
  },
});
