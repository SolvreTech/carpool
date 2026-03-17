"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import SetPageHeader from "@/components/set-page-header";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Card from "@/components/ui/card";
import Avatar from "@/components/ui/avatar";

interface CropState {
  file: File;
  url: string;
  x: number;
  y: number;
  scale: number;
}

function AvatarCropModal({
  crop,
  onCancel,
  onConfirm,
}: {
  crop: CropState;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [x, setX] = useState(crop.x);
  const [y, setY] = useState(crop.y);
  const [scale, setScale] = useState(crop.scale);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = crop.url;
    img.onload = () => {
      imgRef.current = img;
      draw(x, y, scale, img);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop.url]);

  const draw = useCallback(
    (cx: number, cy: number, s: number, img?: HTMLImageElement) => {
      const image = img || imgRef.current;
      const canvas = canvasRef.current;
      if (!image || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      ctx.clearRect(0, 0, size, size);
      const w = image.width * s;
      const h = image.height * s;
      ctx.drawImage(image, cx, cy, w, h);
    },
    []
  );

  useEffect(() => {
    draw(x, y, scale);
  }, [x, y, scale, draw]);

  function handlePointerDown(e: React.PointerEvent) {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: x, oy: y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setX(dragStart.current.ox + dx);
    setY(dragStart.current.oy + dy);
  }

  function handlePointerUp() {
    setDragging(false);
  }

  function handleConfirm() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <h3 className="text-lg font-semibold text-text text-center">
          Adjust Photo
        </h3>
        <p className="text-xs text-text-muted text-center">
          Drag to pan, use the slider to zoom
        </p>
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={256}
            height={256}
            className="h-48 w-48 rounded-full border-2 border-border cursor-grab active:cursor-grabbing touch-none"
            style={{ objectFit: "cover" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">-</span>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-text-muted">+</span>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleConfirm}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carColor, setCarColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropState, setCropState] = useState<CropState | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fullName = session?.user?.name || "User";
  const username = session?.user?.email || "";

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setNickname(data.nickname || "");
          setCarModel(data.carModel || "");
          setCarColor(data.carColor || "");
          setLicensePlate(data.licensePlate || "");
          setVenmoUsername(data.venmoUsername || "");
          setAvatarUrl(data.avatarUrl || "");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropState({ file, url, x: 0, y: 0, scale: 1 });
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    setCropState(null);
    setUploading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatarUrl);
        setFeedback({ type: "success", message: "Photo updated!" });
      } else {
        const data = await res.json().catch(() => null);
        setFeedback({
          type: "error",
          message: data?.error || "Failed to upload photo.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to upload photo." });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          carModel,
          carColor,
          licensePlate,
          venmoUsername: venmoUsername || null,
        }),
      });

      if (res.ok) {
        setFeedback({ type: "success", message: "Profile saved!" });
      } else {
        const data = await res.json().catch(() => null);
        setFeedback({
          type: "error",
          message: data?.error || "Failed to save profile.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4">
        <SetPageHeader title="Profile" backHref="/dashboard" />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <SetPageHeader title="Profile" backHref="/dashboard" />

      {/* Avatar section */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="h-24 w-24 rounded-full object-cover border-2 border-border-light"
            />
          ) : (
            <Avatar
              name={fullName}
              size="lg"
              className="h-24 w-24 text-2xl"
            />
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <h2 className="text-xl font-semibold text-text">{fullName}</h2>
        {username && (
          <p className="text-sm text-text-secondary">{username}</p>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Profile form */}
      <Card className="p-6">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Nickname
            </label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="What should riders call you?"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Car Model
            </label>
            <Input
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              placeholder="e.g. Toyota Camry 2020"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Car Color
            </label>
            <Input
              value={carColor}
              onChange={(e) => setCarColor(e.target.value)}
              placeholder="e.g. Silver"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              License Plate
            </label>
            <Input
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              placeholder="e.g. ABC-1234"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Venmo Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                @
              </span>
              <Input
                value={venmoUsername}
                onChange={(e) =>
                  setVenmoUsername(e.target.value.replace(/^@/, ""))
                }
                placeholder="your-venmo"
                className="pl-7"
              />
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Shown to riders when you request gas money
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </Card>

      {/* Crop modal */}
      {cropState && (
        <AvatarCropModal
          crop={cropState}
          onCancel={() => {
            URL.revokeObjectURL(cropState.url);
            setCropState(null);
          }}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
