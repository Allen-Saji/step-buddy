/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 */
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import {
  Appearance,
  useColorScheme,
  ActivityIndicator,
  View,
} from "react-native";
import * as Screens from "../screens";
import { HomeNavigator } from "./HomeNavigator";
import { StatusBar } from "expo-status-bar";
import {
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from "react-native-paper";
import { useAuth } from "../components/auth/auth-context";

// Import the LoginScreen
import LoginScreen from "../screens/LoginScreen";

// Theme colors
const THEME = {
  primary: "#7C4DFF", // Purple
  dark: "#212121", // Dark Gray/Black
  accent: "#FFFF00", // Yellow
  light: "#E0E0E0", // Light Gray
};

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * If no params are allowed, pass through `undefined`.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 *
 */

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  HomeStack: undefined;
  Settings: undefined;
  // 🔥 Your screens go here
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator();

const AppStack = () => {
  const { user, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: THEME.light,
        }}
      >
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={user ? "HomeStack" : "Login"}
      screenOptions={{
        headerStyle: {
          backgroundColor: THEME.primary,
        },
        headerTintColor: THEME.light,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      {user ? (
        // Authenticated user stack
        <>
          <Stack.Screen
            name="HomeStack"
            component={HomeNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Settings" component={Screens.SettingsScreen} />
          {/** 🔥 Your screens go here */}
        </>
      ) : (
        // Non-authenticated user stack
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> {}

export const AppNavigator = (props: NavigationProps) => {
  const colorScheme = useColorScheme();
  const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

  // Apply our custom theme colors to the combined themes
  const CombinedDefaultTheme = {
    ...MD3LightTheme,
    ...LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      ...LightTheme.colors,
      primary: THEME.primary,
      background: THEME.light,
      text: THEME.dark,
      accent: THEME.accent,
    },
  };
  const CombinedDarkTheme = {
    ...MD3DarkTheme,
    ...DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...DarkTheme.colors,
      primary: THEME.primary,
      background: THEME.dark,
      text: THEME.light,
      accent: THEME.accent,
    },
  };

  return (
    <NavigationContainer
      theme={colorScheme === "dark" ? CombinedDarkTheme : CombinedDefaultTheme}
      {...props}
    >
      <StatusBar />
      <AppStack />
    </NavigationContainer>
  );
};
