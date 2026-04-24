import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyRides() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-lg font-semibold text-text">My Rides</Text>
        <Text className="mt-2 text-center text-text-secondary">
          Your bookings, per-day cancel, and live tracking come next.
        </Text>
      </View>
    </SafeAreaView>
  );
}
