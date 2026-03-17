"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Siren, Clock, MapPin, CheckCircle, User, Route } from "lucide-react";

const PRIORITY_COLOR = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#10b981",
};

const ACTIVE_STATUSES = [
  "incoming",
  "preparing",
  "accepted",
  "arrived",
  "patientOnboard",
];

function StatusBadge({ status }) {
  const colors = {
    incoming: { bg: "#fef3c7", text: "#92400e" },
    preparing: { bg: "#dbeafe", text: "#1e3a8a" },
    accepted: { bg: "#d1fae5", text: "#065f46" },
    arrived: { bg: "#ede9fe", text: "#5b21b6" },
    patientOnboard: { bg: "#dcfce7", text: "#166534" },
    completed: { bg: "#f3f4f6", text: "#374151" },
  };
  const c = colors[status] || colors.incoming;
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

export default function IncomingEmergenciesPage() {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "emergencies"),
      where("hospitalId", "==", user.uid),
      where("status", "in", ACTIVE_STATUSES)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setEmergencies(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleMarkReady = async (id) => {
    await updateDoc(doc(db, "emergencies", id), {
      status: "preparing",
      updatedAt: serverTimestamp(),
    });
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#64748b" }}
          >
            Live Feed
          </span>
        </div>
        <h1 className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>
          Incoming Emergencies
        </h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          {emergencies.length} live case{emergencies.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : emergencies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 rounded-2xl"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}
        >
          <CheckCircle className="text-green-400 mb-3" size={48} />
          <p className="text-lg font-bold" style={{ color: "#0f172a" }}>
            All clear
          </p>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            No incoming emergencies at the moment.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {emergencies.map((em, i) => (
              <motion.div
                key={em.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-5"
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${PRIORITY_COLOR[em.priority] || "#ef4444"}15`,
                      }}
                    >
                      <Siren
                        size={22}
                        style={{ color: PRIORITY_COLOR[em.priority] || "#ef4444" }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <p className="font-bold text-base" style={{ color: "#0f172a" }}>
                          {em.patientName || `Patient #${em.patientId}`}
                        </p>
                        <StatusBadge status={em.status} />
                        {em.priority && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              background: `${PRIORITY_COLOR[em.priority]}15`,
                              color: PRIORITY_COLOR[em.priority],
                            }}
                          >
                            {em.priority.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <p className="text-sm mb-2" style={{ color: "#64748b" }}>
                        <span className="font-medium">Symptoms: </span>
                        {em.symptoms || "Not specified"}
                      </p>

                      <div
                        className="flex items-center gap-4 text-xs flex-wrap"
                        style={{ color: "#94a3b8" }}
                      >
                        {em.eta && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> ETA:
                            <b className="text-orange-500">{em.eta} min</b>
                          </span>
                        )}
                        {em.ambulanceId && (
                          <span className="flex items-center gap-1">
                            <User size={12} /> Amb: {em.ambulanceId}
                          </span>
                        )}
                        {em.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {em.location}
                          </span>
                        )}
                        {(em.hospitalAddress || em.dispatchPlan?.destinationAddress) && (
                          <span className="flex items-center gap-1">
                            <Route size={12} />
                            {em.hospitalAddress || em.dispatchPlan?.destinationAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {em.status === "incoming" && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleMarkReady(em.id)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                        style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
                      >
                        ER Ready
                      </button>
                    </div>
                  )}

                  {em.status === "preparing" && (
                    <div
                      className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: "#eff6ff", color: "#1d4ed8" }}
                    >
                      Waiting for ambulance acknowledgement
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
