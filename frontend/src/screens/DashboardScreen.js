import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AssignmentListScreen from "./assignments/AssignmentListScreen";

import NoticeListScreen from "./notices/NoticeListScreen";

// Existing tab screens
import HomeScreen from "./tabs/HomeScreen";
import SettingsScreen from "./tabs/SettingsScreen";
import AdminScreen from "./tabs/AdminScreen";
import MoreScreen from "./tabs/MoreScreen";

// Course and enrollment screens used as tabs
import CourseListScreen from "./courses/CourseListScreen";
import MyCoursesScreen from "./courses/MyCoursesScreen";
import MyEnrollmentsScreen from "./enrollments/MyEnrollmentsScreen";
import ManageEnrollmentsScreen from "./enrollments/ManageEnrollmentsScreen";

// Ticket screens used as tabs
import TicketsScreen from "./tickets/TicketsScreen";
import ManageTicketsScreen from "./tickets/ManageTicketsScreen";
import ForwardedTicketsScreen from "./tickets/ForwardedTicketsScreen";

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
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Courses tab — everyone sees this */}
      <Tab.Screen
        name="Courses"
        component={CourseListScreen}
        options={{
          tabBarLabel: "Courses",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" color={color} size={size} />
          ),
        }}
      />
      
      {/* Assignments tab — everyone sees this */}
<Tab.Screen
  name="Assignments"
  component={AssignmentListScreen}
  options={{
    tabBarLabel: "Assignments",
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="document-text-outline" color={color} size={size} />
    ),
  }}
/>
      <Tab.Screen
        name="Notices"
        component={NoticeListScreen}
        options={{
          tabBarLabel: "Notices",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone-outline" color={color} size={size} />
          ),
        }}
      />

      {/* More tab — everyone sees this */}
      <Tab.Screen
        name="More"
        component={MoreScreen}
        initialParams={{ userRole }}
        options={{
          tabBarLabel: "More",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Student and rep see My Tickets tab */}
      {(userRole === "student" ||
        userRole === "student_representative") && (
        <Tab.Screen
          name="MyTickets"
          component={TicketsScreen}
          options={{
            tabBarLabel: "My Tickets",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ticket-outline" color={color} size={size} />
            ),
            tabBarButton: () => null,
            tabBarItemStyle: { display: "none" },
          }}
        />
      )}

      {/* Student sees My Enrollments tab */}
      {(userRole === "student" ||
        userRole === "student_representative") && (
        <Tab.Screen
          name="MyEnrollments"
          component={MyEnrollmentsScreen}
          options={{
            tabBarLabel: "Enrollments",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkmark-circle-outline" color={color} size={size} />
            ),
            tabBarButton: () => null,
            tabBarItemStyle: { display: "none" },
          }}
        />
      )}

      {/* Lecturer sees My Courses tab */}
      {userRole === "lecturer" && (
        <Tab.Screen
          name="MyCourses"
          component={MyCoursesScreen}
          options={{
            tabBarLabel: "My Courses",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="library-outline" color={color} size={size} />
            ),
            tabBarButton: () => null,
            tabBarItemStyle: { display: "none" },
          }}
        />
      )}

      {/* Forwarded Tickets — lecturer */}
      {userRole === "lecturer" && (
        <Tab.Screen name="ForwardedTickets" component={ForwardedTicketsScreen}
          options={{
            tabBarLabel: "Tickets",
            tabBarIcon: ({ color, size }) => <Ionicons name="mail-unread-outline" color={color} size={size} />,
            tabBarButton: () => null,
            tabBarItemStyle: { display: "none" },
          }}
        />
      )}

      {/* Admin sees Manage Enrollments tab */}
      {userRole === "admin" && (
        <Tab.Screen
          name="ManageEnrollments"
          component={ManageEnrollmentsScreen}
          options={{
            tabBarLabel: "Enrollments",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkmark-circle-outline" color={color} size={size} />
            ),
            tabBarButton: () => null,
            tabBarItemStyle: { display: "none" },
          }}
        />
      )}

      {/* Manage Tickets — admin and rep */}
      {(userRole === "admin" || userRole === "student_representative") && (
        <Tab.Screen name="ManageTickets" component={ManageTicketsScreen}
          options={{
            tabBarLabel: "Tickets",
            tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" color={color} size={size} />,
            tabBarButton: () => null,
            tabBarItemStyle: { display: "none" },
          }}
        />
      )}

      {/* Admin sees Users tab */}
      {userRole === "admin" && (
        <Tab.Screen
          name="Users"
          component={AdminScreen}
          options={{
            tabBarLabel: "Users",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" color={color} size={size} />
            ),
            tabBarButton: () => null,
            tabBarItemStyle: { display: "none" },
          }}
        />
      )}

      {/* Settings tab — hidden, accessed from More */}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tab.Navigator>
  );
};

export default DashboardScreen;