"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Stethoscope, BedDouble } from "lucide-react";

const PRIORITY = {
  critical: { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444", order: 0 },
  high:     { bg: "#fff7ed", text: "#9a3412", dot: "#f97316", order: 1 },
  medium:   { bg: "#fefce8", text: "#854d0e", dot: "#eab308", order: 2 },
  low:      { bg: "#f0fdf4", text: "#065f46", dot: "#22c55e", order: 3 },
};

export default function PatientQueuePage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "patientQueue"), where("hospitalId", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const pa = PRIORITY[a.priority]?.order ?? 9;
        const pb = PRIORITY[b.priority]?.order ?? 9;
        return pa !== pb ? pa - pb : (a.arrivalTime?.seconds || 0) - (b.arrivalTime?.seconds || 0);
      });
      setPatients(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const formatTime = ts => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>🏥 Patient Queue</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          {patients.length} patient{patients.length !== 1 ? "s" : ""} in queue — sorted by priority
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : patients.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 rounded-2xl"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
          <Users size={48} style={{ color: "#cbd5e1" }} className="mb-3" />
          <p className="text-lg font-bold" style={{ color: "#0f172a" }}>Queue is empty</p>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Patients arriving will appear here in real-time.</p>
        </motion.div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          {/* Table header */}
          <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b text-xs font-semibold uppercase tracking-wide"
            style={{ background: "#f8fafc", borderColor: "#e2e8f0", color: "#64748b" }}>
            <span>#  Patient</span>
            <span>Symptoms</span>
            <span>Ward</span>
            <span>Doctor</span>
            <span>Priority</span>
            <span>Arrival</span>
          </div>
          {/* Rows */}
          <AnimatePresence>
            {patients.map((p, i) => {
              const pri = PRIORITY[p.priority] || PRIORITY.low;
              return (
                <motion.div key={p.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-6 gap-4 px-5 py-4 items-center border-b last:border-0 hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "#f1f5f9" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-semibold truncate" style={{ color: "#0f172a" }}>{p.patientName || p.name || "Unknown"}</span>
                  </div>
                  <span className="text-xs truncate" style={{ color: "#64748b" }}>{p.symptoms || "—"}</span>
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: p.priority === 'critical' ? "#ef4444" : "#3b82f6" }}>
                    <BedDouble size={14} />
                    <span className="text-xs truncate">{p.assignedWard || "Pending Ward"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Stethoscope size={12} style={{ color: "#94a3b8" }} />
                    <span className="text-xs truncate" style={{ color: "#374151" }}>{p.assignedDoctor || "Unassigned"}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold w-fit"
                    style={{ background: pri.bg, color: pri.text }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: pri.dot }} />
                    {p.priority?.charAt(0).toUpperCase() + p.priority?.slice(1) || "Low"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} style={{ color: "#94a3b8" }} />
                    <span className="text-xs" style={{ color: "#64748b" }}>{formatTime(p.arrivalTime)}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}