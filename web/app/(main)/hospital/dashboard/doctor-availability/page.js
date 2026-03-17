"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  collection, onSnapshot, deleteDoc, doc, updateDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const STATUS_STYLE = {
  available: { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  busy:      { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  off:       { bg: "#f3f4f6", text: "#374151", dot: "#9ca3af" },
};

export default function DoctorAvailabilityPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ name: "", specialization: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "hospitals", user.uid, "doctors"), snap => {
      setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const addDoctor = async () => {
    if (!form.name || !form.specialization) return;
    setAdding(true);
    
    // Using setDoc with auto-generated ID and merge: true to avoid ALREADY_EXISTS 
    // errors that occure during hot-reloads or spotty network retries with addDoc.
    const newDocRef = doc(collection(db, "hospitals", user.uid, "doctors"));
    await setDoc(newDocRef, {
      name: form.name, 
      specialization: form.specialization,
      status: "available", 
      createdAt: serverTimestamp(),
    }, { merge: true });

    setForm({ name: "", specialization: "" });
    setAdding(false);
  };

  const toggleStatus = async (id, current) => {
    const next = current === "available" ? "busy" : current === "busy" ? "off" : "available";
    await updateDoc(doc(db, "hospitals", user.uid, "doctors", id), { status: next });
  };

  const removeDoctor = async (id) => {
    await deleteDoc(doc(db, "hospitals", user.uid, "doctors", id));
  };

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>👨‍⚕️ Doctor Availability</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Manage doctors on duty — changes sync instantly</p>
      </motion.div>

      {/* Add Doctor Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl p-5 mb-6" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#0f172a" }}>Add New Doctor</h2>
        <div className="flex gap-3 flex-wrap">
          <input placeholder="Doctor name" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="flex-1 min-w-48 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#0f172a" }}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "#e2e8f0"}
          />
          <input placeholder="Specialization" value={form.specialization}
            onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))}
            className="flex-1 min-w-48 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#0f172a" }}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            onKeyDown={e => e.key === "Enter" && addDoctor()}
          />
          <button onClick={addDoctor} disabled={adding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
            <Plus size={16} />
            {adding ? "Adding…" : "Add Doctor"}
          </button>
        </div>
      </motion.div>

      {/* Doctor List */}
      <div className="space-y-3">
        <AnimatePresence>
          {doctors.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40 rounded-2xl"
              style={{ background: "#fff", border: "1px dashed #e2e8f0" }}>
              <Stethoscope size={36} style={{ color: "#cbd5e1" }} className="mb-2" />
              <p className="text-sm" style={{ color: "#94a3b8" }}>No doctors added yet. Add one above.</p>
            </motion.div>
          ) : doctors.map((dr, i) => {
            const s = STATUS_STYLE[dr.status] || STATUS_STYLE.available;
            return (
              <motion.div key={dr.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
                style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                {/* Left */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base text-white"
                    style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
                    {dr.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#0f172a" }}>{dr.name}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>{dr.specialization}</p>
                  </div>
                </div>
                {/* Right */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                    style={{ background: s.bg, color: s.text }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                    {dr.status?.charAt(0).toUpperCase() + dr.status?.slice(1)}
                  </span>
                  <button onClick={() => toggleStatus(dr.id, dr.status)}
                    className="p-2 rounded-xl transition-all hover:bg-blue-50"
                    title="Toggle status">
                    {dr.status === "off" ? <ToggleLeft size={20} style={{ color: "#94a3b8" }} /> : <ToggleRight size={20} style={{ color: "#3b82f6" }} />}
                  </button>
                  <button onClick={() => removeDoctor(dr.id)}
                    className="p-2 rounded-xl transition-all hover:bg-red-50 text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}