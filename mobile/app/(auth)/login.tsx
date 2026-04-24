import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth-store";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!username.trim() || !password) {
      setError("Enter your username and password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: AuthUser }>(
        "/api/auth/mobile/login",
        {
          method: "POST",
          auth: false,
          body: { username: username.trim(), password },
        }
      );
      await signIn(data.token, data.user);
      router.replace("/(app)");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Couldn't sign in. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="text-3xl font-bold text-text">Welcome back</Text>
          <Text className="mt-1 text-text-secondary">Sign in to your carpool account.</Text>

          {error ? (
            <View className="mt-4 rounded-xl bg-red-50 p-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          <View className="mt-6 gap-3">
            <Field
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="yourname"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
            />
          </View>

          <Pressable
            disabled={loading}
            onPress={handleSubmit}
            className={`mt-6 h-12 items-center justify-center rounded-2xl ${
              loading ? "bg-primary/70" : "bg-primary active:bg-emerald-700"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">Sign in</Text>
            )}
          </Pressable>

          <View className="mt-6 flex-row justify-center gap-1">
            <Text className="text-sm text-text-secondary">No account?</Text>
            <Link href="/(auth)/register" className="text-sm font-semibold text-primary">
              Create one
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-text-secondary">{label}</Text>
      <TextInput
        placeholderTextColor="#9ca3af"
        className="rounded-xl border border-border bg-white px-4 py-3 text-base text-text"
        {...rest}
      />
    </View>
  );
}
