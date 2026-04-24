import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { apiFetch } from "./api";

// Expo Go on Android dropped remote-push support in SDK 53. On iOS it still
// works, but to keep behavior consistent (and avoid the noisy module-import
// error on Android), we skip notifications entirely in Expo Go. Dev builds
// and production builds use the real module.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Returns the Expo push token (ExponentPushToken[...]) or null if unavailable
// (Expo Go, simulator, permission denied, no EAS projectId, etc.).
export async function registerForPushAsync(): Promise<string | null> {
  if (isExpoGo) {
    if (__DEV__) {
      console.log(
        "[notifications] Skipping push registration in Expo Go. Use a dev build: `npx eas build --profile development`."
      );
    }
    return null;
  }

  // Import lazily so the module isn't even evaluated in Expo Go.
  const [Notifications, Device] = await Promise.all([
    import("expo-notifications"),
    import("expo-device"),
  ]);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (!Device.isDevice) return null; // simulators can't receive push

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#059669",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    if (__DEV__) {
      console.warn(
        "Expo push tokens require a projectId. Run `npx eas-cli init` to set one up."
      );
    }
    return null;
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResult.data;
}

// Sends the Expo push token to the server so we can deliver pushes to this device.
export async function syncPushTokenToServer(token: string): Promise<void> {
  await apiFetch("/api/notifications/register", {
    method: "POST",
    body: { expoPushToken: token, platform: Platform.OS },
  });
}
