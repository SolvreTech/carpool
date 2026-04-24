import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { registerForPushAsync, syncPushTokenToServer } from "@/lib/notifications";

export default function AppTabsLayout() {
  const { status } = useAuth();

  // Best-effort push registration once authenticated. Failures are silent —
  // the app still works without push.
  useEffect(() => {
    if (status !== "authed") return;
    (async () => {
      try {
        const token = await registerForPushAsync();
        if (token) await syncPushTokenToServer(token);
      } catch {
        // ignore
      }
    })();
  }, [status]);

  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#059669" />
      </View>
    );
  }
  if (status === "anon") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#9ca3af",
        headerStyle: { backgroundColor: "#ffffff" },
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="find"
        options={{
          title: "Find a Ride",
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-rides"
        options={{
          title: "My Rides",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
