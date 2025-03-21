import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../components/auth/auth-context";
import GoogleAuth from "../components/auth/google-auth";
import { LinearGradient } from "expo-linear-gradient";

// Enhanced color palette with gradient-friendly colors
const THEME = {
  primaryDark: "#5626C4", // Darker purple
  primary: "#7C4DFF", // Purple
  primaryLight: "#9E7EFF", // Lighter purple
  dark: "#121212", // Very dark (near black)
  accent: "#FFFF00", // Yellow
  accentDark: "#D4D400", // Darker yellow
  light: "#FFFFFF", // Pure white for better contrast
};

export default function LoginScreen({ navigation }) {
  const { setUser } = useAuth();

  const handleAuthStateChange = (userData) => {
    if (userData) {
      // User is logged in, navigate to home screen
      setUser(userData);
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[THEME.dark, THEME.primaryDark, THEME.dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        {/* Decorative circular gradient */}
        <LinearGradient
          colors={[THEME.primary, "transparent"]}
          style={styles.circle1}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Decorative yellow accent */}
        <LinearGradient
          colors={[THEME.accent, "transparent"]}
          style={styles.circle2}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.mascotContainer}>
              <Image
                source={require("../../assets/step-buddy.png")}
                style={styles.mascot}
                resizeMode="contain"
              />
            </View>

            <View style={styles.brandingContainer}>
              <Text style={styles.title}>
                <Text style={styles.titleMain}>StepBuddy</Text>
                <Text style={styles.titleDot}>.</Text>
                <Text style={styles.titleSol}>sol</Text>
              </Text>
              <LinearGradient
                colors={[THEME.accentDark, THEME.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.subtitleContainer}
              >
                <Text style={styles.subtitle}>Your Daily Step Sidekick</Text>
              </LinearGradient>
            </View>

            <View style={styles.authContainer}>
              <GoogleAuth onAuthStateChange={handleAuthStateChange} />
            </View>

            <LinearGradient
              colors={["rgba(126, 87, 194, 0.3)", "rgba(126, 87, 194, 0.1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.footer}
            >
              <Text style={styles.footerText}>
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </Text>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  circle1: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },
  circle2: {
    position: "absolute",
    bottom: -150,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.15,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  mascotContainer: {
    alignItems: "center",
  },
  mascot: {
    width: 240,
    height: 240,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  brandingContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 46,
    fontWeight: "bold",
    marginBottom: 12,
    fontFamily: "System",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  titleMain: {
    color: THEME.primaryLight,
  },
  titleDot: {
    color: THEME.accent,
  },
  titleSol: {
    color: THEME.primaryLight,
    opacity: 0.8,
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.dark,
    textAlign: "center",
  },
  authContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: THEME.light,
    textAlign: "center",
  },
});
