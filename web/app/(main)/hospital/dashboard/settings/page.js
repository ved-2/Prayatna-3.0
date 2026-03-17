"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { seedHospital } from "@/lib/seedFirestore";
import { motion } from "framer-motion";
import { Save, RefreshCw, Lock, Building2, Phone, Mail, MapPin, FlaskConical } from "lucide-react";

function Field({ icon: Icon, label, type = "text", value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>
        <Icon size={12} /> {label}
      </span>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="rounded-xl px-4 py-3 text-sm outline-none transition-all"
        style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#0f172a" }}
        onFocus={e => e.target.style.borderColor = "#3b82f6"}
        onBlur={e => e.target.style.borderColor = "#e2e8f0"}
      />
    </label>
  );
}

export default function SettingsPage() {
  const { user, userData, logout } = useAuth();
  const [profile, setProfile] = useState({ name: "", address: "", phone: "", email: "", lat: "", lng: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState(null); // null | "saving" | "success" | "error"
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "hospitals", user.uid), snap => {
      if (snap.exists()) {
        const d = snap.data();
        setProfile({
          name: d.name || "",
          address: d.address || "",
          phone: d.phone || "",
          email: d.email || user.email || "",
          lat: d.lat || "",
          lng: d.lng || "",
        });
      } else {
        // Auto-create the hospital document if it doesn't exist
        setDoc(doc(db, "hospitals", user.uid), {
          name: userData?.hospitalName || userData?.name || "",
          email: user.email || "",
          address: "", phone: "",
          beds: { icu: { total: 10, available: 5 }, general: { total: 50, available: 25 }, emergency: { total: 15, available: 8 } },
          resources: { oxygen: 50, ventilators: 12, emergencyKits: 30, icuEquipment: 8, bloodBags: 40, wheelchairs: 20 },
          doctorsOnDuty: 0,
          lat: (Math.random() * (19.2 - 19.0) + 19.0).toFixed(4), // default mock coords near Mumbai
          lng: (Math.random() * (73.0 - 72.8) + 72.8).toFixed(4),
          createdAt: new Date(),
        }, { merge: true });
      }
    });
    return () => unsub();
  }, [user, userData]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    await setDoc(doc(db, "hospitals", user.uid), profile, { merge: true });
    setSavingProfile(false);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2500);
  };

  const savePassword = async () => {
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New passwords don't match."); return;
    }
    if (pwForm.next.length < 6) {
      setPwError("Password must be at least 6 characters."); return;
    }
    setPwStatus("saving"); setPwError("");
    try {
      const credential = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, pwForm.next);
      setPwStatus("success");
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwStatus(null), 3000);
    } catch (err) {
      setPwError(err.message || "Failed to update password.");
      setPwStatus("error");
    }
  };

  return (
    <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
        <h1 className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>⚙️ Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Manage hospital profile, security, and account settings</p>
      </motion.div>

      <div className="flex flex-col gap-6">
        {/* Hospital Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-6"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff" }}>
              <Building2 size={18} style={{ color: "#3b82f6" }} />
            </div>
            <h2 className="text-base font-bold" style={{ color: "#0f172a" }}>Hospital Profile</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <Field icon={Building2} label="Hospital Name" value={profile.name} placeholder="City General Hospital"
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
            <Field icon={Phone} label="Contact Phone" type="tel" value={profile.phone} placeholder="+91 98765 43210"
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
            <Field icon={Mail} label="Email" type="email" value={profile.email} placeholder="admin@hospital.com"
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
            <Field icon={MapPin} label="Address" value={profile.address} placeholder="123 Medical Ave, City"
              onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} />
            <Field icon={MapPin} label="Latitude" type="number" value={profile.lat} placeholder="19.0760"
              onChange={e => setProfile(p => ({ ...p, lat: e.target.value }))} />
            <Field icon={MapPin} label="Longitude" type="number" value={profile.lng} placeholder="72.8777"
              onChange={e => setProfile(p => ({ ...p, lng: e.target.value }))} />
          </div>
          <button onClick={saveProfile} disabled={savingProfile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: savedProfile ? "#10b981" : "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
            {savingProfile ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {savingProfile ? "Saving…" : savedProfile ? "✓ Profile Saved!" : "Save Profile"}
          </button>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-6"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#fef3c7" }}>
                <Lock size={18} style={{ color: "#f59e0b" }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: "#0f172a" }}>Change Password</h2>
            </div>
            <div className="space-y-4 mb-5">
              <Field icon={Lock} label="Current Password" type="password" value={pwForm.current}
                onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} placeholder="Current password" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field icon={Lock} label="New Password" type="password" value={pwForm.next}
                  onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} placeholder="New password (min 6 chars)" />
                <Field icon={Lock} label="Confirm New Password" type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Confirm new password" />
              </div>
            </div>
            {pwError && <p className="text-sm text-red-500 mb-3">{pwError}</p>}
            {pwStatus === "success" && <p className="text-sm text-green-600 mb-3">✓ Password updated successfully!</p>}
            <button onClick={savePassword} disabled={pwStatus === "saving"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
              {pwStatus === "saving" ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
              {pwStatus === "saving" ? "Updating…" : "Update Password"}
            </button>
          </motion.div>

          {/* Seed Demo Data */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-6"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div className="flex items-center gap-3 mb-2">
              <FlaskConical size={18} style={{ color: "#10b981" }} />
              <h2 className="text-base font-bold" style={{ color: "#065f46" }}>Demo / Hackathon Seed</h2>
            </div>
            <p className="text-sm mb-4" style={{ color: "#059669" }}>Populate Firestore with realistic sample data for all dashboard sections.</p>
            <SeedButton uid={user?.uid} />
          </motion.div>

          {/* Danger Zone */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl p-6"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <h2 className="text-base font-bold mb-2" style={{ color: "#991b1b" }}>Danger Zone</h2>
            <p className="text-sm mb-4" style={{ color: "#dc2626" }}>Logging out will end your hospital session.</p>
            <button onClick={logout}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: "#ef4444" }}>
              Logout from HospiConnect
            </button>
          </motion.div>
      </div>
    </div>
  );
}

function SeedButton({ uid }) {
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  const run = async () => {
    if (!uid) return;
    setSeeding(true);
    try {
      await seedHospital(uid);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (e) {
      console.error("Seed error:", e);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <button onClick={run} disabled={seeding}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
      style={{ background: done ? "#10b981" : "linear-gradient(135deg,#10b981,#059669)" }}>
      {seeding ? <RefreshCw size={14} className="animate-spin" /> : <FlaskConical size={14} />}
      {seeding ? "Seeding data…" : done ? "✓ Firestore seeded!" : "Seed Demo Data"}
    </button>
  );
}