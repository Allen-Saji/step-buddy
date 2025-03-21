import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the shape of the user object
type User = {
  id: string;
  name: string;
  email: string;
  picture?: string;
} | null;

// Define the shape of the context
type AuthContextType = {
  user: User;
  loading: boolean;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
});

// Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing user on component mount
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const userJSON = await AsyncStorage.getItem("user");
        if (userJSON) {
          setUser(JSON.parse(userJSON));
        }
      } catch (error) {
        console.error("Failed to load user from storage:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  // Function to update user
  const updateUser = async (newUser: User) => {
    setUser(newUser);

    if (newUser) {
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
    }
  };

  // Function to handle logout
  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, setUser: updateUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);
