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

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!fullName.trim() || !username.trim() || !password) {
      setError("All fields are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: AuthUser }>(
        "/api/auth/mobile/register",
        {
          method: "POST",
          auth: false,
          body: {
            fullName: fullName.trim(),
            username: username.trim(),
            password,
          },
        }
      );
      await signIn(data.token, data.user);
      router.replace("/(app)");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Couldn't create your account. Try again.");
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
          <Text className="text-3xl font-bold text-text">Create account</Text>
          <Text className="mt-1 text-text-secondary">Join to start carpooling.</Text>

          {error ? (
            <View className="mt-4 rounded-xl bg-red-50 p-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          <View className="mt-6 gap-3">
            <Field
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Doe"
              autoCapitalize="words"
            />
            <Field
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="janedoe"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              textContentType="newPassword"
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
              <Text className="text-base font-semibold text-white">Create account</Text>
            )}
          </Pressable>

          <View className="mt-6 flex-row justify-center gap-1">
            <Text className="text-sm text-text-secondary">Already have an account?</Text>
            <Link href="/(auth)/login" className="text-sm font-semibold text-primary">
              Sign in
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
