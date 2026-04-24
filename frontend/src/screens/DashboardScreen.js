import React, { useState, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";

import HomeScreen from "./tabs/HomeScreen";
import SettingsScreen from "./tabs/SettingsScreen";
import AdminScreen from "./tabs/AdminScreen";

const Tab = createBottomTabNavigator();

const DashboardScreen = ({ navigation }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserRole();
  }, []);

  const getUserRole = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
      }
    } catch (error) {
      console.log("Error getting user role:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1a73e8",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
        }}
      />

      {userRole === "admin" && (
        <Tab.Screen
          name="Users"
          component={AdminScreen}
          options={{
            tabBarLabel: "Users",
          }}
        />
      )}

      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: "Settings",
        }}
      >
        {() => <SettingsScreen navigation={navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default DashboardScreen;