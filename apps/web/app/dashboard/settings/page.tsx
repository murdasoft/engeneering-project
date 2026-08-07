"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  preferences: { threshold?: number; notifications?: Record<string, boolean> } | null;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(0.25);
  const [notifications, setNotifications] = useState({
    emailCompleted: true,
    criticalAlerts: true,
    weeklySummary: false,
    teamActivity: false,
  });

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user);
          setName(data.user.name ?? "");
          setPhone(data.user.phone ?? "");
          setCompany(data.user.company ?? "");
          setPosition(data.user.position ?? "");
          setBio(data.user.bio ?? "");
          const prefs = data.user.preferences;
          if (prefs) {
            if (typeof prefs.threshold === "number") setThreshold(prefs.threshold);
            if (prefs.notifications) setNotifications(prefs.notifications);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          company,
          position,
          bio,
          preferences: { threshold, notifications },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <header className="mb-xl">
        <p className="font-label-caps text-label-caps text-secondary mb-xs">SETTINGS</p>
        <h2 className="font-display-lg text-display-lg">Account Settings</h2>
        <p className="font-body-md text-on-surface-variant mt-xs">Manage your profile and platform preferences.</p>
      </header>

      <section className="bg-surface-container-lowest border border-outline-variant p-lg mb-lg">
        <h3 className="font-title-sm text-title-sm mb-lg">Profile</h3>
        <div className="flex items-center gap-lg mb-lg">
          <div className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xl">
            {name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="font-title-sm text-title-sm">{name || "User"}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{profile?.email}</p>
            <span className="font-label-caps text-[10px] text-primary mt-xs inline-block">
              {profile?.role ?? "ENGINEER"}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">FULL NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-md py-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">EMAIL</label>
            <input
              type="email"
              value={profile?.email ?? ""}
              disabled
              className="w-full px-md py-md bg-surface-container border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface-variant"
            />
          </div>
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">PHONE</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-md py-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:outline-none"
              placeholder="+7 777 123 45 67"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">COMPANY</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-md py-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:outline-none"
                placeholder="LLC Engineering"
              />
            </div>
            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">POSITION</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-md py-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:outline-none"
                placeholder="Structural Engineer"
              />
            </div>
          </div>
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">BIO</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-md py-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:outline-none"
              placeholder="Brief professional bio..."
            />
          </div>
          <div className="flex items-center gap-md">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-lg py-md bg-primary text-on-primary font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-xs"
            >
              {saving ? (
                <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>SAVING...</>
              ) : (
                "SAVE CHANGES"
              )}
            </button>
            {saved && (
              <span className="flex items-center gap-xs text-primary font-label-caps text-[11px]">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                SAVED
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant p-lg mb-lg">
        <h3 className="font-title-sm text-title-sm mb-lg">ML Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">ML API ENDPOINT</label>
            <input
              type="text"
              value={process.env.NEXT_PUBLIC_ML_API_URL ?? "https://alllxndr-inspectai-ml.hf.space"}
              disabled
              className="w-full px-md py-md bg-surface-container border border-outline-variant rounded-lg font-mono-data text-mono-data text-on-surface-variant"
            />
          </div>
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">CONFIDENCE THRESHOLD</label>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="font-mono-data text-mono-data text-on-surface-variant mt-xs">
              Current: {threshold.toFixed(2)} — Lower = more sensitive (more false positives). Higher = more conservative.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant p-lg">
        <h3 className="font-title-sm text-title-sm mb-lg">Notifications</h3>
        <div className="space-y-md">
          {[
            { key: "emailCompleted" as const, label: "Email notifications for completed analyses" },
            { key: "criticalAlerts" as const, label: "Critical defect alerts" },
            { key: "weeklySummary" as const, label: "Weekly summary reports" },
            { key: "teamActivity" as const, label: "Team activity updates" },
          ].map((n) => (
            <label key={n.key} className="flex items-center gap-md cursor-pointer">
              <input
                type="checkbox"
                checked={notifications[n.key]}
                onChange={(e) => setNotifications((prev) => ({ ...prev, [n.key]: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <span className="font-body-md text-body-md">{n.label}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
