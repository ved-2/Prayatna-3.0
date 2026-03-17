"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bed, User, Save, RefreshCw, LayoutDashboard } from "lucide-react";

// ─── Single Bed Unit ───────────────────────────────────────────────────────────
function BedUnit({ id, status, accentColor, onToggle }) {
  const occupied = status === "occupied";
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.06, y: -3 }}
      whileTap={{ scale: 0.94 }}
      onClick={onToggle}
      title={`Bed ${id} — click to toggle`}
      className="relative cursor-pointer rounded-2xl p-3 border-2 transition-all duration-300 select-none"
      style={{
        background: occupied ? "#0f172a" : "#fff",
        borderColor: occupied ? accentColor : "#e2e8f0",
        borderStyle: occupied ? "solid" : "dashed",
        boxShadow: occupied ? `0 8px 24px ${accentColor}30` : "0 1px 6px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex flex-col items-center gap-2 py-1">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: occupied ? `${accentColor}25` : "#f1f5f9" }}>
          {occupied
            ? <User size={18} style={{ color: accentColor }} />
            : <Bed size={18} style={{ color: "#94a3b8" }} />}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest"
          style={{ color: occupied ? "#94a3b8" : "#cbd5e1" }}>
          {id < 10 ? `0${id}` : id}
        </span>
        <span className="text-[9px] font-bold"
          style={{ color: occupied ? "#fff" : "#94a3b8" }}>
          {occupied ? "OCCUPIED" : "VACANT"}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Ward Section ──────────────────────────────────────────────────────────────
function WardSection({ ward, beds, accentColor, onToggle }) {
  const occupied = beds.filter(b => b.status === "occupied").length;
  const total = beds.length;
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div className="rounded-3xl overflow-hidden mb-6"
      style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>

      {/* Ward header */}
      <div className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "#f1f5f9", background: "#fafbfc" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${accentColor}15` }}>
            <Bed size={16} style={{ color: accentColor }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{ward}</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>{occupied} occupied · {total - occupied} vacant · {total} total</p>
          </div>
        </div>
        {/* Occupancy pill */}
        <div className="flex items-center gap-3">
          <div className="w-28 h-2.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ height: "100%", background: accentColor, borderRadius: "9999px" }}
            />
          </div>
          <span className="text-sm font-bold min-w-[3rem] text-right" style={{ color: accentColor }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Bed grid */}
      <div className="p-6 grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))" }}>
        <AnimatePresence mode="popLayout">
          {beds.map(bed => (
            <BedUnit
              key={bed.id}
              id={bed.id}
              status={bed.status}
              accentColor={accentColor}
              onToggle={() => onToggle(ward, bed.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Build beds array from Firestore data ──────────────────────────────────────
// Single source of truth: beds.*.available  (the stored count).
// wardLayout is used for the visual layout ONLY when it is perfectly consistent
// with the stored available count — otherwise we re-derive from scratch.
function buildBeds(firestoreData, wardKey) {
  const bedsConfig     = firestoreData?.beds?.[wardKey] || {};
  const total          = bedsConfig.total     ?? 0;
  const storedAvail    = bedsConfig.available ?? total;   // default: all free
  const occupiedCount  = Math.max(0, total - storedAvail);
  const layout         = firestoreData?.wardLayout?.[wardKey];

  // wardLayout is valid only when length matches AND its occupied count matches
  if (Array.isArray(layout) && layout.length === total) {
    const layoutOccupied = layout.filter(b => b.status === "occupied").length;
    if (layoutOccupied === occupiedCount) {
      return layout;   // ✅ layout is perfectly in sync — use it
    }
  }

  // Re-derive: first occupiedCount beds = occupied, rest = available
  return Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    status: i < occupiedCount ? "occupied" : "available",
  }));
}

const WARDS = [
  { key: "icu",       label: "ICU Beds",       color: "#3b82f6" },
  { key: "general",   label: "General Beds",   color: "#10b981" },
  { key: "emergency", label: "Emergency Beds", color: "#ef4444" },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function BedManagementPage() {
  const { user } = useAuth();
  const [rawData, setRawData] = useState(null);
  const [wardBeds, setWardBeds] = useState({});   // { icu: [...], general: [...], emergency: [...] }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Live sync from Firestore
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "hospitals", user.uid), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setRawData(data);
        setWardBeds({
          icu:       buildBeds(data, "icu"),
          general:   buildBeds(data, "general"),
          emergency: buildBeds(data, "emergency"),
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Toggle a single bed's occupancy locally
  const toggleBed = (wardLabel, bedId) => {
    const wardKey = WARDS.find(w => w.label === wardLabel)?.key;
    if (!wardKey) return;
    setWardBeds(prev => ({
      ...prev,
      [wardKey]: prev[wardKey].map(b =>
        b.id === bedId
          ? { ...b, status: b.status === "occupied" ? "available" : "occupied" }
          : b
      ),
    }));
  };

  // Save to Firestore — write wardLayout + recompute available counts
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const wardLayout = {};
    const bedsUpdate = { ...rawData?.beds };

    WARDS.forEach(({ key }) => {
      wardLayout[key] = wardBeds[key];
      const available = wardBeds[key].filter(b => b.status !== "occupied").length;
      bedsUpdate[key] = { ...bedsUpdate[key], available };
    });

    await setDoc(doc(db, "hospitals", user.uid), {
      wardLayout,
      beds: bedsUpdate,
    }, { merge: true });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Summary totals
  const totalBeds     = WARDS.reduce((s, { key }) => s + (wardBeds[key]?.length || 0), 0);
  const totalOccupied = WARDS.reduce((s, { key }) => s + (wardBeds[key]?.filter(b => b.status === "occupied").length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#f8fafc" }}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-blue-500" size={36} />
          <p className="font-semibold text-slate-400 tracking-wide">Loading ward data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1" style={{ color: "#3b82f6" }}>
            <LayoutDashboard size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Live Floor Plan</span>
          </div>
          <h1 className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>🛏 Bed Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Click any bed to toggle occupancy · Save to sync with Firestore
          </p>
        </div>

        {/* Summary pill + Save */}
        <div className="flex items-center gap-3 p-2 rounded-2xl"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div className="px-4 py-1.5 border-r" style={{ borderColor: "#f1f5f9" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Occupied</p>
            <p className="text-xl font-extrabold" style={{ color: "#0f172a" }}>
              {totalOccupied}
              <span style={{ color: "#cbd5e1" }}> / </span>
              <span style={{ color: "#94a3b8", fontSize: "1rem" }}>{totalBeds}</span>
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: saved ? "#10b981" : "linear-gradient(135deg,#0f172a,#1e3a5f)" }}>
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Syncing…" : saved ? "✓ Saved!" : "Save Changes"}
          </motion.button>
        </div>
      </motion.div>

      {/* Ward Sections */}
      {WARDS.map(({ key, label, color }, i) => (
        <motion.div key={key}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}>
          <WardSection
            ward={label}
            beds={wardBeds[key] || []}
            accentColor={color}
            onToggle={toggleBed}
          />
        </motion.div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-6 justify-center mt-2">
        {[
          { label: "Vacant", border: "dashed", bg: "#fff", dot: "#94a3b8" },
          { label: "Occupied", border: "solid", bg: "#0f172a", dot: "#3b82f6" },
        ].map(({ label, border, bg, dot }) => (
          <div key={label} className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#64748b" }}>
            <div className="w-5 h-5 rounded-md border-2" style={{ background: bg, borderColor: dot, borderStyle: border }} />
            {label}
          </div>
        ))}
        <p className="text-xs" style={{ color: "#94a3b8" }}>💡 Click a bed to toggle · Save to persist</p>
      </div>
    </div>
  );
}