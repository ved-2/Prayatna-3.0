"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import {
  RefreshCw,
  Save,
  AlertTriangle,
  Plus,
  Minus,
  PackageOpen,
  Wind,
  HeartPulse,
  Droplet,
  Box,
  Crosshair,
  Accessibility,
} from "lucide-react";
import { toast } from "sonner";

const RESOURCES_CONFIG = [
  { key: "oxygen", label: "Oxygen", icon: <Wind size={18} />, max: 100, alert: 20 },
  { key: "defibrillator", label: "Defibrillator", icon: <HeartPulse size={18} />, max: 40, alert: 5 },
  { key: "emergencyKits", label: "Emergency Kits", icon: <Box size={18} />, max: 80, alert: 15 },
  { key: "icuEquipment", label: "ICU Equip", icon: <Crosshair size={18} />, max: 30, alert: 5 },
  { key: "bloodBags", label: "Blood Bags", icon: <Droplet size={18} />, max: 150, alert: 30 },
  { key: "wheelchairs", label: "Wheelchairs", icon: <Accessibility size={18} />, max: 50, alert: 10 },
];

const DEFAULT_RESOURCES = {
  oxygen: 45,
  defibrillator: 12,
  emergencyKits: 30,
  icuEquipment: 8,
  bloodBags: 40,
  wheelchairs: 20,
};

export default function Page() {
  const { user } = useAuth();
  const [resources, setResources] = useState(DEFAULT_RESOURCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const ref = doc(db, "hospitals", user.uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.resources) {
            setResources((prev) => ({ ...prev, ...data.resources }));
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Realtime sync failed");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const update = (key, val) => {
    const num = Number(val);
    setResources((prev) => ({
      ...prev,
      [key]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const change = (key, amt) => {
    setResources((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) + amt),
    }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const ref = doc(db, "hospitals", user.uid);
      await setDoc(ref, { resources }, { merge: true });
      toast.success("Saved successfully");
    } catch (e) {
      console.error(e);
      toast.error("Error saving data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="animate-spin text-blue-500" />
      </div>
    );
  }

  const total = Object.values(resources).reduce((a, b) => a + b, 0);
  const low = RESOURCES_CONFIG.filter((r) => (resources[r.key] || 0) <= r.alert);

  return (
    <div className="min-h-screen bg-slate-50 p-4">

      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <PackageOpen size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg">Hospital Resources</h1>
            <p className="text-xs text-slate-500">Live Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">Total: {total}</span>
          <button
            onClick={save}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
          >
            {saving ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Alert */}
      {low.length > 0 && (
        <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 flex gap-2 items-center">
          <AlertTriangle size={16} />
          Low: {low.map((i) => i.label).join(", ")}
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RESOURCES_CONFIG.map((r) => (
          <Card
            key={r.key}
            data={r}
            value={resources[r.key] || 0}
            update={update}
            change={change}
          />
        ))}
      </div>
    </div>
  );
}

function Card({ data, value, update, change }) {
  const pct = Math.min(100, (value / data.max) * 100);
  const low = value <= data.alert;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">

      {/* Top */}
      <div className="flex justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-2 rounded-lg">{data.icon}</div>
          <span className="font-medium">{data.label}</span>
        </div>
        <span className={low ? "text-red-500" : "text-blue-600"}>
          {Math.round(pct)}%
        </span>
      </div>

      {/* Progress */}
      <div className="h-2 bg-slate-100 rounded-full mb-3">
        <div
          className={`h-2 rounded-full ${low ? "bg-red-500" : "bg-blue-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => change(data.key, -1)}
          className="bg-slate-100 px-3 py-1 rounded-lg"
        >
          <Minus size={14} />
        </button>

        <input
          type="number"
          value={value}
          onChange={(e) => update(data.key, e.target.value)}
          className="flex-1 text-center border rounded-lg"
        />

        <button
          onClick={() => change(data.key, 1)}
          className="bg-slate-100 px-3 py-1 rounded-lg"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}