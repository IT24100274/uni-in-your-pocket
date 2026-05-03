import React, { useState, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";

import NoticeListScreen from "../screens/notices/NoticeListScreen";
import NoticeDetailScreen from "../screens/notices/NoticeDetailScreen";
import CreateNoticeScreen from "../screens/notices/CreateNoticeScreen";

// Course screens
import CourseListScreen from "../screens/courses/CourseListScreen";
import CourseDetailScreen from "../screens/courses/CourseDetailScreen";
import CreateCourseScreen from "../screens/courses/CreateCourseScreen";
import EditCourseScreen from "../screens/courses/EditCourseScreen";
import MyCoursesScreen from "../screens/courses/MyCoursesScreen";

// Enrollment screens
import MyEnrollmentsScreen from "../screens/enrollments/MyEnrollmentsScreen";
import ManageEnrollmentsScreen from "../screens/enrollments/ManageEnrollmentsScreen";

import AssignmentListScreen from "../screens/assignments/AssignmentListScreen";
import AssignmentDetailScreen from "../screens/assignments/AssignmentDetailScreen";
import CreateAssignmentScreen from "../screens/assignments/CreateAssignmentScreen";
import SubmitAssignmentScreen from "../screens/assignments/SubmitAssignmentScreen";
import SubmissionsListScreen from "../screens/assignments/SubmissionsListScreen";
// Mahdhi Ticket screens
import TicketsScreen from "../screens/tickets/TicketsScreen";
import RaiseTicketScreen from "../screens/tickets/RaiseTicketScreen";
import TicketDetailScreen from "../screens/tickets/TicketDetailScreen";
import ManageTicketsScreen from "../screens/tickets/ManageTicketsScreen";
import ForwardedTicketsScreen from "../screens/tickets/ForwardedTicketsScreen";

// Sathya — Marks & Results drill-down screens
import EnterMarksScreen from "../screens/marks/EnterMarksScreen";
import ResultDetailScreen from "../screens/marks/ResultDetailScreen";

// Mo's internship screens
import InternshipScreen from "../screens/internship/InternshipScreen";
import CreateInternshipScreen from "../screens/internship/CreateInternshipScreen";
import LogScreen from "../screens/internship/LogScreen";
import ProgressDashboardScreen from "../screens/internship/ProgressDashboardScreen";
import ReviewScreen from "../screens/internship/ReviewScreen";

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

        <Stack.Screen 
        name="NoticeList" 
        component={NoticeListScreen} 
        options={{ headerShown: true, title: "Notices & Events" }} 
        />

        <Stack.Screen
         name="NoticeDetail" 
         component={NoticeDetailScreen} 
         options={{ headerShown: true, title: "Notice" }} 
         />
        <Stack.Screen 
        name="CreateNotice" 
        component={CreateNoticeScreen} 
        options={{ headerShown: true, title: "New Notice" }} 
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

        {/* Assignment screens */}
<Stack.Screen
  name="AssignmentList"
  component={AssignmentListScreen}
  options={{ headerShown: true, title: "Assignments" }}
/>
<Stack.Screen
  name="AssignmentDetail"
  component={AssignmentDetailScreen}
  options={{ headerShown: true, title: "Assignment Details" }}
/>
<Stack.Screen
  name="CreateAssignment"
  component={CreateAssignmentScreen}
  options={{ headerShown: true, title: "Create Assignment" }}
/>
<Stack.Screen
  name="SubmitAssignment"
  component={SubmitAssignmentScreen}
  options={{ headerShown: true, title: "Submit Assignment" }}
/>
<Stack.Screen
  name="SubmissionsList"
  component={SubmissionsListScreen}
  options={{ headerShown: true, title: "Submissions" }}
/>
        {/* Mahdhi Ticket screens */}
        <Stack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ headerShown: true, title: "Ticket Details" }} />
        <Stack.Screen name="RaiseTicket" component={RaiseTicketScreen} options={{ headerShown: true, title: "Raise a Ticket" }} />

        {/* Sathya — Marks & Results drill-down screens */}
        <Stack.Screen
          name="EnterMarks"
          component={EnterMarksScreen}
          options={{ headerShown: true, title: "Enter Marks" }}
        />
        <Stack.Screen
          name="ResultDetail"
          component={ResultDetailScreen}
          options={{ headerShown: true, title: "Result Details" }}
        />
{/* Internship screens */}
<Stack.Screen
  name="MyInternship"
  component={InternshipScreen}
  options={{ headerShown: true, title: "My Internship" }}
/>
<Stack.Screen
  name="CreateInternship"
  component={CreateInternshipScreen}
  options={{ headerShown: true, title: "Create Internship" }}
/>
<Stack.Screen
  name="InternshipLog"
  component={LogScreen}
  options={{ headerShown: true, title: "Weekly Log" }}
/>
<Stack.Screen
  name="InternshipProgress"
  component={ProgressDashboardScreen}
  options={{ headerShown: true, title: "Progress Dashboard" }}
/>
<Stack.Screen
  name="ReviewInternships"
  component={ReviewScreen}
  options={{ headerShown: true, title: "Review Internships" }}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
