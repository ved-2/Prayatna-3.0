"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Clock, Ambulance, BedDouble } from "lucide-react";

function StatBig({ label, value, unit, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl p-5"
      style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className="text-sm font-medium" style={{ color: "#64748b" }}>{label}</span>
      </div>
      <p className="text-4xl font-extrabold" style={{ color: "#0f172a" }}>{value}<span className="text-lg font-medium ml-1" style={{ color: "#94a3b8" }}>{unit}</span></p>
    </motion.div>
  );
}

function HorizontalBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm" style={{ color: "#374151" }}>{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>{value} / {max}</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: "9999px" }}
        />
      </div>
    </div>
  );
}

export default function ReportsAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [hospital, setHospital] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsubA = onSnapshot(doc(db, "analytics", user.uid), snap => {
      if (snap.exists()) setAnalytics(snap.data());
    });
    const unsubH = onSnapshot(doc(db, "hospitals", user.uid), snap => {
      if (snap.exists()) setHospital(snap.data());
    });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const q = query(collection(db, "emergencies"), where("hospitalId", "==", user.uid));
    const unsubE = onSnapshot(q, snap => {
      setEmergencies(snap.docs.map(d => d.data()));
    });
    return () => { unsubA(); unsubH(); unsubE(); };
  }, [user]);

  // Computed stats
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEmergencies = emergencies.filter(e => e.createdAt?.toDate?.() >= today).length;
  const resolved = emergencies.filter(e => e.status === "completed").length;
  const avgEta = emergencies.filter(e => e.eta).reduce((acc, e, _, arr) => acc + e.eta / arr.length, 0).toFixed(0);
  const beds = hospital?.beds || {};
  const icuTotal = beds.icu?.total || 0;
  const icuAvail = beds.icu?.available || 0;
  const genTotal = beds.general?.total || 0;
  const genAvail = beds.general?.available || 0;

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>📊 Reports & Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Performance metrics and hospital statistics — live from Firestore</p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatBig label="Emergencies Today" value={analytics?.emergenciesToday ?? todayEmergencies} unit="cases" icon={TrendingUp} color="#ef4444" delay={0.0} />
        <StatBig label="Cases Resolved" value={analytics?.casesResolved ?? resolved} unit="total" icon={BarChart3} color="#10b981" delay={0.06} />
        <StatBig label="Avg. Ambulance ETA" value={analytics?.avgResponseTime ?? (avgEta || "—")} unit="min" icon={Clock} color="#f59e0b" delay={0.12} />
        <StatBig label="Ambulances Today" value={analytics?.ambulancesToday ?? "—"} unit="units" icon={Ambulance} color="#6366f1" delay={0.18} />
      </div>

      {/* Bed Usage Graph */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="rounded-2xl p-6 mb-5"
        style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center gap-3 mb-5">
          <BedDouble size={20} style={{ color: "#3b82f6" }} />
          <h2 className="text-base font-bold" style={{ color: "#0f172a" }}>Bed Usage</h2>
        </div>
        <HorizontalBar label="ICU Beds (occupied)" value={icuTotal - icuAvail} max={icuTotal} color="#3b82f6" />
        <HorizontalBar label="General Beds (occupied)" value={genTotal - genAvail} max={genTotal} color="#10b981" />
        <HorizontalBar label="Emergency Beds (occupied)" value={(beds.emergency?.total || 0) - (beds.emergency?.available || 0)} max={beds.emergency?.total || 0} color="#ef4444" />
      </motion.div>

      {/* Emergency History Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl p-6"
        style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#0f172a" }}>Emergency Status Breakdown</h2>
        <div className="flex flex-wrap gap-4">
          {[
            { label: "Incoming", count: emergencies.filter(e => e.status === "incoming").length, color: "#ef4444" },
            { label: "Preparing", count: emergencies.filter(e => e.status === "preparing").length, color: "#f59e0b" },
            { label: "Accepted", count: emergencies.filter(e => e.status === "accepted").length, color: "#3b82f6" },
            { label: "Arrived", count: emergencies.filter(e => e.status === "arrived").length, color: "#8b5cf6" },
            { label: "On Board", count: emergencies.filter(e => e.status === "patientOnboard").length, color: "#16a34a" },
            { label: "Completed", count: emergencies.filter(e => e.status === "completed").length, color: "#10b981" },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-sm font-semibold" style={{ color }}>{label}: {count}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
