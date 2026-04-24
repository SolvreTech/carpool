import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Find() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-lg font-semibold text-text">Find a Ride</Text>
        <Text className="mt-2 text-center text-text-secondary">
          Carpool browsing, date picker, and booking come next.
        </Text>
      </View>
    </SafeAreaView>
  );
}
