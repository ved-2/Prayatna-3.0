"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { PackageOpen, Save, RefreshCw } from "lucide-react";

const RESOURCES_CONFIG = [
  { key: "oxygen",        label: "Oxygen Cylinders",     icon: "🫁", unit: "cylinders", color: "#3b82f6" },
  { key: "ventilators",   label: "Ventilators",           icon: "🫀", unit: "units",     color: "#6366f1" },
  { key: "emergencyKits", label: "Emergency Kits",        icon: "🧰", unit: "kits",      color: "#f59e0b" },
  { key: "icuEquipment",  label: "ICU Equipment Sets",    icon: "🏥", unit: "sets",      color: "#ef4444" },
  { key: "bloodBags",     label: "Blood Bags",            icon: "🩸", unit: "bags",      color: "#dc2626" },
  { key: "wheelchairs",   label: "Wheelchairs",           icon: "♿", unit: "units",      color: "#10b981" },
];

const DEFAULT_RESOURCES = {
  oxygen: 50, ventilators: 12, emergencyKits: 30,
  icuEquipment: 8, bloodBags: 40, wheelchairs: 20,
};

export default function ResourceManagementPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState(DEFAULT_RESOURCES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "hospitals", user.uid), snap => {
      if (snap.exists() && snap.data().resources)
        setResources({ ...DEFAULT_RESOURCES, ...snap.data().resources });
    });
    return () => unsub();
  }, [user]);

  const handleChange = (key, val) => {
    setResources(prev => ({ ...prev, [key]: parseInt(val) || 0 }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await updateDoc(doc(db, "hospitals", user.uid), { resources });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>⚙️ Resource Management</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Update hospital resource counts — syncs to network in real-time</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
        {RESOURCES_CONFIG.map(({ key, label, icon, unit, color }, i) => {
          const val = resources[key] ?? 0;
          const maxVal = { oxygen: 100, ventilators: 20, emergencyKits: 50, icuEquipment: 15, bloodBags: 80, wheelchairs: 30 }[key] || 100;
          const pct = Math.min(100, Math.round((val / maxVal) * 100));

          return (
            <motion.div key={key}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-5"
              style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${color}12` }}>
                  {icon}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{label}</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>Available: {val} {unit}</p>
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "#f1f5f9" }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{ height: "100%", background: pct < 20 ? "#ef4444" : pct < 50 ? "#f59e0b" : color, borderRadius: "9999px" }}
                />
              </div>
              {pct < 20 && (
                <p className="text-xs font-semibold mb-2" style={{ color: "#ef4444" }}>⚠ Low stock — replenish soon</p>
              )}

              {/* Input */}
              <input
                type="number" min={0} value={val}
                onChange={e => handleChange(key, e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-all"
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#0f172a" }}
                onFocus={e => e.target.style.borderColor = color}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
            </motion.div>
          );
        })}
      </div>

      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        onClick={handleSave} disabled={saving}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all"
        style={{ background: saved ? "#10b981" : "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
        {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? "Saving…" : saved ? "✓ Resources Updated!" : "Save Resources"}
      </motion.button>
    </div>
  );
}