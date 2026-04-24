import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-store";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <ScrollView contentContainerClassName="px-4 py-6" className="flex-1">
        <Text className="text-2xl font-bold text-text">Hello, {firstName}!</Text>
        <Text className="mt-1 text-text-secondary">What would you like to do today?</Text>

        <View className="mt-6 gap-4">
          <RoleCard
            title="I'm Driving"
            subtitle="Create a carpool and offer rides"
            icon="🚗"
            onPress={() => router.push("/(app)/find")}
          />
          <RoleCard
            title="I Need a Ride"
            subtitle="Find and book available carpools"
            icon="🧍"
            onPress={() => router.push("/(app)/find")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-border bg-white p-5 active:bg-primary-50"
    >
      <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <Text className="text-lg font-semibold text-text">{title}</Text>
      <Text className="mt-0.5 text-sm text-text-secondary">{subtitle}</Text>
    </Pressable>
  );
}
