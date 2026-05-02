import React, { useState, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";

// Course Screens
import CourseDetailScreen from "../screens/courses/CourseDetailScreen";
import CreateCourseScreen from "../screens/courses/CreateCourseScreen";
import EditCourseScreen from "../screens/courses/EditCourseScreen";

// Enrollment Screens
import ManageEnrollmentsScreen from "../screens/enrollments/ManageEnrollmentsScreen";

// Marks & Results Screens
import EnterMarksScreen from "../screens/marks/EnterMarksScreen";
import ManageResultsScreen from "../screens/marks/ManageResultsScreen";
import ResultsListScreen from "../screens/marks/ResultsListScreen";
import ResultDetailScreen from "../screens/marks/ResultDetailScreen";
import AdminResultsScreen from "../screens/marks/AdminResultsScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />

        {/* Course Screens */}
        <Stack.Screen
          name="CreateCourse"
          component={CreateCourseScreen}
          options={{ headerShown: true, title: "Create Course" }}
        />
        <Stack.Screen
          name="CourseDetail"
          component={CourseDetailScreen}
          options={{ headerShown: true, title: "Course Details" }}
        />
        <Stack.Screen
          name="EditCourse"
          component={EditCourseScreen}
          options={{ headerShown: true, title: "Edit Course" }}
        />

        {/* Enrollment Screens */}
        <Stack.Screen
          name="ManageEnrollments"
          component={ManageEnrollmentsScreen}
          options={{ headerShown: true, title: "Manage Enrollments" }}
        />

        {/* Marks & Results Screens */}
        <Stack.Screen
          name="EnterMarks"
          component={EnterMarksScreen}
          options={{ headerShown: true, title: "Enter Marks" }}
        />
        <Stack.Screen
          name="ManageResults"
          component={ManageResultsScreen}
          options={{ headerShown: true, title: "Manage Results" }}
        />
        <Stack.Screen
          name="ResultsList"
          component={ResultsListScreen}
          options={{ headerShown: true, title: "My Results" }}
        />
        <Stack.Screen
          name="ResultDetail"
          component={ResultDetailScreen}
          options={{ headerShown: true, title: "Result Details" }}
        />
        <Stack.Screen
          name="AdminResults"
          component={AdminResultsScreen}
          options={{ headerShown: true, title: "Manage All Results" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;