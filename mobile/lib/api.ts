import { getToken } from "./auth-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL && __DEV__) {
  // Surface misconfiguration early in dev. In prod the build will fail loudly on fetch.
  console.warn("EXPO_PUBLIC_API_URL is not set. Set it in .env or via EAS secrets.");
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, payload: unknown, message: string) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

type RequestOpts = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean; // default true — send bearer token if available
};

export async function apiFetch<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = opts;
  const h: Record<string, string> = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = await getToken();
    if (token) h.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: unknown = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    payload = await res.json().catch(() => null);
  } else {
    payload = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload && typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, payload, message);
  }

  return payload as T;
}
