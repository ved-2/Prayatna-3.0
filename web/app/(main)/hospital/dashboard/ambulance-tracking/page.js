"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, User, Clock, MapPin, CheckCircle, Route } from "lucide-react";
import dynamic from "next/dynamic";

const DynamicLiveMap = dynamic(() => import("@/components/hospital/LiveTrackerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm font-bold">
      Loading Map...
    </div>
  ),
});

function statusMeta(ambulance) {
  if (ambulance.patientOnboard) {
    return {
      label: "Patient On Board",
      background: "#fef2f2",
      color: "#991b1b",
    };
  }
  if (ambulance.currentEmergencyId) {
    return {
      label: "Assigned",
      background: "#fff7ed",
      color: "#9a3412",
    };
  }
  return {
    label: "Available",
    background: "#f0fdf4",
    color: "#065f46",
  };
}

export default function AmbulanceTrackingPage() {
  const { user } = useAuth();
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "ambulances"), where("hospitalId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setAmbulances(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#64748b" }}>
            Live Tracking
          </span>
        </div>
        <h1 className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>
          Ambulance Tracking
        </h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          {ambulances.length} ambulance{ambulances.length !== 1 ? "s" : ""} assigned to this hospital
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ambulances.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 rounded-2xl"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}
        >
          <CheckCircle size={48} className="text-green-400 mb-3" />
          <p className="text-lg font-bold" style={{ color: "#0f172a" }}>
            No ambulances currently
          </p>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Ambulances assigned to your hospital will appear here in real-time.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence>
            {ambulances.map((amb, i) => {
              const meta = statusMeta(amb);
              return (
                <motion.div
                  key={amb.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    className="px-5 py-4 flex items-center justify-between"
                    style={{
                      background: "linear-gradient(135deg,#0f172a,#1e3a5f)",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.1)" }}
                      >
                        <Ambulance size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">
                          {amb.ambulanceId || `AMB-${amb.id.slice(0, 5).toUpperCase()}`}
                        </p>
                        <p className="text-xs" style={{ color: "#94a3b8" }}>
                          Unit ID
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: meta.background, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="p-5 grid grid-cols-2 gap-4">
                    <InfoField icon={User} label="Driver" value={amb.driverName || "Unknown"} />
                    <InfoField
                      icon={Clock}
                      label="ETA to Hospital"
                      value={amb.eta ? `${amb.eta} min` : "—"}
                      color="#f59e0b"
                    />
                    <InfoField
                      icon={MapPin}
                      label="Current Location"
                      value={amb.location || "GPS updating..."}
                    />
                    <InfoField
                      icon={Ambulance}
                      label="Patient"
                      value={amb.patientName || (amb.currentEmergencyId ? "Assigned" : "None")}
                    />
                    <InfoField
                      icon={Route}
                      label="Destination"
                      value={amb.destinationHospitalName || amb.destinationAddress || "Not set"}
                    />
                    <InfoField
                      icon={Clock}
                      label="Dispatch"
                      value={amb.dispatchStatus || "available"}
                    />
                  </div>

                  <div
                    className="mx-5 mb-5 rounded-xl overflow-hidden h-40 relative z-0"
                    style={{
                      background: "linear-gradient(135deg,#e2e8f0,#f1f5f9)",
                      border: "1px dashed #cbd5e1",
                    }}
                  >
                    {amb.gpsLat && amb.gpsLng ? (
                      <DynamicLiveMap
                        lat={amb.gpsLat}
                        lng={amb.gpsLng}
                        popupText={`Ambulance ${amb.ambulanceId || amb.id.slice(0, 5)}`}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <MapPin size={28} style={{ color: "#94a3b8" }} className="mx-auto mb-1" />
                        <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>
                          Acquiring GPS signal...
                        </p>
                      </div>
                    )}
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

function InfoField({ icon: Icon, label, value, color = "#0f172a" }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={12} style={{ color: "#94a3b8" }} />
        <span className="text-xs" style={{ color: "#94a3b8" }}>
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
