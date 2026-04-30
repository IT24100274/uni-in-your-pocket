import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Existing tab screens
import HomeScreen from "./tabs/HomeScreen";
import SettingsScreen from "./tabs/SettingsScreen";
import AdminScreen from "./tabs/AdminScreen";

// Course and enrollment screens used as tabs
import CourseListScreen from "./courses/CourseListScreen";
import MyCoursesScreen from "./courses/MyCoursesScreen";
import MyEnrollmentsScreen from "./enrollments/MyEnrollmentsScreen";
import ManageEnrollmentsScreen from "./enrollments/ManageEnrollmentsScreen";

const Tab = createBottomTabNavigator();

const DashboardScreen = () => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserRole();
  }, []);

  const getUserRole = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const user = JSON.parse(userData);
      setUserRole(user.role);
    } catch (error) {
      console.log("Error getting user role:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1a73e8",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          paddingBottom: "1%",
          height: 60,
        },
      }}
    >
      {/* Home tab — everyone sees this */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "Home" }}
      />

      {/* Courses tab — everyone sees this */}
      <Tab.Screen
        name="Courses"
        component={CourseListScreen}
        options={{ tabBarLabel: "Courses" }}
      />

      {/* Student sees My Enrollments tab */}
      {(userRole === "student" ||
        userRole === "student_representative") && (
        <Tab.Screen
          name="MyEnrollments"
          component={MyEnrollmentsScreen}
          options={{ tabBarLabel: "Enrollments" }}
        />
      )}

      {/* Lecturer sees My Courses tab */}
      {userRole === "lecturer" && (
        <Tab.Screen
          name="MyCourses"
          component={MyCoursesScreen}
          options={{ tabBarLabel: "My Courses" }}
        />
      )}

      {/* Admin sees Manage Enrollments tab */}
      {userRole === "admin" && (
        <Tab.Screen
          name="ManageEnrollments"
          component={ManageEnrollmentsScreen}
          options={{ tabBarLabel: "Enrollments" }}
        />
      )}

      {/* Admin sees Users tab */}
      {userRole === "admin" && (
        <Tab.Screen
          name="Users"
          component={AdminScreen}
          options={{ tabBarLabel: "Users" }}
        />
      )}

      {/* Settings tab — everyone sees this */}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: "Settings" }}
      />
    </Tab.Navigator>
  );
};

export default DashboardScreen;