"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  BedDouble, Siren, Ambulance, Activity,
  Users, Clock, CheckCircle2, AlertTriangle, Stethoscope,
} from "lucide-react";

// ─── Animated stat card ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, delay = 0, alert = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "#fff",
        border: `1px solid ${alert ? color + "40" : "#e2e8f0"}`,
        boxShadow: alert ? `0 4px 20px ${color}20` : "0 1px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}>
          <Icon size={21} style={{ color }} />
        </div>
        <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ background: `${color}12`, color }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
          Live
        </span>
      </div>
      <div>
        <p className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>{value ?? "—"}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: "#64748b" }}>{label}</p>
        {sub && <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Bed progress row ──────────────────────────────────────────────────────────
function BedBar({ label, available, total, color }) {
  const occupied = total - available;
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const isLow = available <= Math.floor(total * 0.2) && total > 0;

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "#374151" }}>{label}</span>
          {isLow && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#fef2f2", color: "#ef4444" }}>
              ⚠ LOW
            </span>
          )}
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {available}<span style={{ color: "#94a3b8", fontWeight: 400 }}>/{total} available</span>
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          style={{
            height: "100%",
            background: pct >= 80 ? "#ef4444" : pct >= 60 ? "#f59e0b" : color,
            borderRadius: "9999px",
          }}
        />
      </div>
      <p className="text-[11px] mt-1" style={{ color: "#94a3b8" }}>
        {occupied} occupied · {pct}% utilization
      </p>
    </div>
  );
}

// ─── Recent emergency row ──────────────────────────────────────────────────────
const PRIORITY_COLORS = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };
const STATUS_LABELS = { incoming: "Incoming", accepted: "Accepted", preparing: "Preparing", completed: "Done" };

function EmergencyRow({ em }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const pc = PRIORITY_COLORS[em.priority] || "#94a3b8";
  const ts = em.createdAt?.toDate?.();
  const ago = ts && now
    ? (() => {
        const s = (now - ts.getTime()) / 1000;
        if (s < 60) return `${Math.floor(s)}s ago`;
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        return `${Math.floor(s / 3600)}h ago`;
      })()
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-3 border-b last:border-0"
      style={{ borderColor: "#f1f5f9" }}
    >
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: pc }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#0f172a" }}>
          {em.patientName || `Patient #${em.patientId}`}
        </p>
        <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{em.symptoms || "—"}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${pc}15`, color: pc }}>
          {STATUS_LABELS[em.status] || em.status}
        </span>
        <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>{ago}</p>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();

  const [hospital, setHospital] = useState(null);
  const [doctorsOnDuty, setDoctorsOnDuty] = useState(0);
  const [doctorsAvail, setDoctorsAvail] = useState(0);
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [networkRequests, setNetworkRequests] = useState(0);

  // ── 1. Hospital doc (beds, resources, name) ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "hospitals", user.uid), snap => {
      if (snap.exists()) setHospital(snap.data());
    });
  }, [user]);

  // ── 2. Doctors subcollection ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "hospitals", user.uid, "doctors"), snap => {
      const docs = snap.docs.map(d => d.data());
      setDoctorsOnDuty(docs.filter(d => d.status === "available" || d.status === "busy").length);
      setDoctorsAvail(docs.filter(d => d.status === "available").length);
    });
  }, [user]);

  // ── 3. Emergencies ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "emergencies"), where("hospitalId", "==", user.uid));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setEmergencies(data);
    });
  }, [user]);

  // ── 5. Network Requests (Incoming) ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "transferRequests"),
      where("toHospital", "==", user.uid),
      where("status", "==", "pending")
    );
    return onSnapshot(q, snap => {
      setNetworkRequests(snap.docs.length);
    });
  }, [user]);

  // ── Computed values ──────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const activeEmergencies  = emergencies.filter(e => e.status === "incoming" || e.status === "accepted" || e.status === "preparing").length;
  const todayEmergencies   = emergencies.filter(e => e.createdAt?.toDate?.() >= today).length;
  const completedToday     = emergencies.filter(e => e.status === "completed" && e.createdAt?.toDate?.() >= today).length;
  const ambulancesEnRoute  = ambulances.filter(a => a.patientOnboard).length;

  // ── Beds: single source of truth = beds.*.available (written by Bed Management on Save) ──
  const beds = hospital?.beds || {};
  const icu       = { total: beds.icu?.total ?? 0,       available: beds.icu?.available       ?? 0 };
  const general   = { total: beds.general?.total ?? 0,   available: beds.general?.available   ?? 0 };
  const emergency = { total: beds.emergency?.total ?? 0, available: beds.emergency?.available ?? 0 };
  const totalBeds      = icu.total + general.total + emergency.total;
  const totalAvailable = icu.available + general.available + emergency.available;


  // Recent — last 5 emergencies
  const recent = emergencies.slice(0, 5);

  return (
    <div className="p-8">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>Live · Real-time</span>
        </div>
        <h1 className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>
          {hospital?.name || "Hospital Dashboard"}
        </h1>
        {/* <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          {hospital?.address || "All data synced live from Firestore"}
        </p> */}
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
        <StatCard icon={BedDouble}     label="Total Beds Occupied"   value={`${totalBeds - totalAvailable} / ${totalBeds}`}          color="#3b82f6" delay={0.00} sub={`${totalAvailable} available across all wards`} />
        <StatCard icon={Activity}      label="Pending Network Requests" value={networkRequests}                                        color="#06b6d4" delay={0.04} sub="Requests from other hospitals" alert={networkRequests > 0} />
        <StatCard icon={Siren}         label="Active Emergencies"    value={activeEmergencies}                                        color="#ef4444" delay={0.08} sub="Incoming + accepted + preparing" alert={activeEmergencies > 0} />
        <StatCard icon={Ambulance}     label="Ambulances En Route"   value={ambulancesEnRoute}                                        color="#f59e0b" delay={0.12} sub="Patients on board" />
        <StatCard icon={Activity}      label="Today's Emergencies"   value={todayEmergencies}                                         color="#8b5cf6" delay={0.16} sub={`${completedToday} resolved today`} />
        <StatCard icon={Users}         label="Doctors On Duty"       value={`${doctorsOnDuty}`}                                       color="#22c55e" delay={0.20} sub={`${doctorsAvail} available · ${doctorsOnDuty - doctorsAvail} busy`} />
      </div>

      {/* ── Bottom two-col grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Bed Occupancy */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="rounded-2xl p-6"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: "#0f172a" }}>Bed Occupancy</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "#f0fdf4", color: "#16a34a" }}>
              From ward layout · live
            </span>
          </div>
          <BedBar label="ICU Beds"       available={icu.available}       total={icu.total}       color="#6366f1" />
          <BedBar label="General Beds"   available={general.available}   total={general.total}   color="#10b981" />
          <BedBar label="Emergency Beds" available={emergency.available} total={emergency.total} color="#ef4444" />
        </motion.div>

        {/* Recent Emergencies feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
          className="rounded-2xl p-6"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: "#0f172a" }}>Recent Emergencies</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "#fef2f2", color: "#ef4444" }}>
              {activeEmergencies} active
            </span>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32">
              <CheckCircle2 size={32} className="text-green-400 mb-2" />
              <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>No emergencies recorded</p>
            </div>
          ) : (
            <AnimatePresence>
              {recent.map(em => <EmergencyRow key={em.id} em={em} />)}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Doctor status breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-6"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <h2 className="text-base font-bold mb-4" style={{ color: "#0f172a" }}>Doctor Status</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Available", value: doctorsAvail, color: "#10b981", bg: "#f0fdf4" },
              { label: "Busy",      value: doctorsOnDuty - doctorsAvail, color: "#f59e0b", bg: "#fffbeb" },
              { label: "Off Duty",  value: 0 /* calculated below */, color: "#94a3b8", bg: "#f8fafc" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-4 text-center" style={{ background: bg }}>
                <p className="text-2xl font-extrabold" style={{ color }}>{label === "Off Duty" ? "—" : value}</p>
                <p className="text-xs font-semibold mt-1" style={{ color }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Ambulance snapshot */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
          className="rounded-2xl p-6"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: "#0f172a" }}>Ambulances</h2>
            <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{ambulances.length} total</span>
          </div>
          {ambulances.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24">
              <Ambulance size={28} style={{ color: "#cbd5e1" }} className="mb-2" />
              <p className="text-sm" style={{ color: "#94a3b8" }}>No ambulances assigned</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ambulances.slice(0, 4).map(amb => (
                <div key={amb.id} className="flex items-center justify-between py-2 border-b last:border-0"
                  style={{ borderColor: "#f1f5f9" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: amb.patientOnboard ? "#fef2f2" : "#f0fdf4" }}>
                      <Ambulance size={15} style={{ color: amb.patientOnboard ? "#ef4444" : "#10b981" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                        {amb.ambulanceId || `AMB-${amb.id.slice(0,5)}`}
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{amb.driverName || "Driver"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: amb.patientOnboard ? "#fef2f2" : "#f0fdf4", color: amb.patientOnboard ? "#ef4444" : "#10b981" }}>
                      {amb.patientOnboard ? "En Route" : "Available"}
                    </span>
                    {amb.eta && <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>ETA {amb.eta} min</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}