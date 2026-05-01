import React, { useState, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";

// Course screens
import CourseListScreen from "../screens/courses/CourseListScreen";
import CourseDetailScreen from "../screens/courses/CourseDetailScreen";
import CreateCourseScreen from "../screens/courses/CreateCourseScreen";
import EditCourseScreen from "../screens/courses/EditCourseScreen";
import MyCoursesScreen from "../screens/courses/MyCoursesScreen";

// Enrollment screens
import MyEnrollmentsScreen from "../screens/enrollments/MyEnrollmentsScreen";
import ManageEnrollmentsScreen from "../screens/enrollments/ManageEnrollmentsScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is already logged in when app opens
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.log("Error checking login status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking login status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? "Dashboard" : "Login"}
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Auth screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />

        {/* Course screens */}
        <Stack.Screen
          name="CourseList"
          component={CourseListScreen}
          options={{ headerShown: true, title: "All Courses" }}
        />
        <Stack.Screen
          name="CourseDetail"
          component={CourseDetailScreen}
          options={{ headerShown: true, title: "Course Details" }}
        />
        <Stack.Screen
          name="CreateCourse"
          component={CreateCourseScreen}
          options={{ headerShown: true, title: "Create Course" }}
        />
        <Stack.Screen
          name="EditCourse"
          component={EditCourseScreen}
          options={{ headerShown: true, title: "Edit Course" }}
        />
        <Stack.Screen
          name="MyCourses"
          component={MyCoursesScreen}
          options={{ headerShown: true, title: "My Courses" }}
        />

        {/* Enrollment screens */}
        <Stack.Screen
          name="MyEnrollments"
          component={MyEnrollmentsScreen}
          options={{ headerShown: true, title: "My Enrollments" }}
        />
        <Stack.Screen
          name="ManageEnrollments"
          component={ManageEnrollmentsScreen}
          options={{ headerShown: true, title: "Manage Enrollments" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;