import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth-store";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#059669" />
      </View>
    );
  }

  return <Redirect href={status === "authed" ? "/(app)" : "/(auth)/login"} />;
}
