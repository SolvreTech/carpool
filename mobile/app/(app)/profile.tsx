import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-store";

export default function Profile() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <View className="flex-1 p-6">
        <View className="rounded-2xl border border-border p-5">
          <Text className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Signed in as
          </Text>
          <Text className="mt-1 text-lg font-semibold text-text">{user?.name}</Text>
          {user?.email && (
            <Text className="text-sm text-text-secondary">{user.email}</Text>
          )}
        </View>

        <Pressable
          onPress={() => {
            Alert.alert("Sign out?", "You'll need to log in again.", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: signOut },
            ]);
          }}
          className="mt-6 rounded-2xl border border-border p-4 active:bg-gray-50"
        >
          <Text className="text-center text-sm font-medium text-red-600">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
