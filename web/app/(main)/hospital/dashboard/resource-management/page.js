"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PackageOpen, Save, RefreshCw, AlertTriangle, Plus, Minus, 
  Wind, HeartPulse, Droplet, Box, Crosshair, Accessibility 
} from "lucide-react";

const RESOURCES_CONFIG = [
  { key: "oxygen", label: "Oxygen Supply", icon: <Wind size={20} />, unit: "Cylinders", color: "#0ea5e9", gradient: "from-sky-400 to-blue-600", max: 100, alertThreshold: 20 },
  { key: "ventilators", label: "Ventilators", icon: <HeartPulse size={20} />, unit: "Units", color: "#8b5cf6", gradient: "from-violet-400 to-purple-600", max: 40, alertThreshold: 5 },
  { key: "emergencyKits", label: "Emergency Kits", icon: <Box size={20} />, unit: "Kits", color: "#f59e0b", gradient: "from-amber-400 to-orange-500", max: 80, alertThreshold: 15 },
  { key: "icuEquipment", label: "ICU Equipments", icon: <Crosshair size={20} />, unit: "Sets", color: "#ec4899", gradient: "from-pink-400 to-rose-500", max: 30, alertThreshold: 5 },
  { key: "bloodBags", label: "Blood Reserve", icon: <Droplet size={20} />, unit: "Bags", color: "#ef4444", gradient: "from-red-400 to-rose-600", max: 150, alertThreshold: 30 },
  { key: "wheelchairs", label: "Wheelchairs", icon: <Accessibility size={20} />, unit: "Units", color: "#10b981", gradient: "from-emerald-400 to-teal-500", max: 50, alertThreshold: 10 },
];

const DEFAULT_RESOURCES = {
  oxygen: 45, ventilators: 12, emergencyKits: 30,
  icuEquipment: 8, bloodBags: 40, wheelchairs: 20,
};

export default function ResourceManagementPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState(DEFAULT_RESOURCES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "hospitals", user.uid), snap => {
      if (snap.exists() && snap.data().resources) {
        setResources({ ...DEFAULT_RESOURCES, ...snap.data().resources });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleChange = (key, val) => {
    setResources(prev => ({ ...prev, [key]: Math.max(0, parseInt(val) || 0) }));
  };

  const adjustValue = (key, amount) => {
    setResources(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) + amount) }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "hospitals", user.uid), { resources }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="animate-spin text-blue-500" size={40} />
        <p className="text-slate-400 font-medium animate-pulse">Loading Matrix...</p>
      </div>
    );
  }

  const lowStockItems = RESOURCES_CONFIG.filter(r => (resources[r.key] || 0) <= r.alertThreshold);
  const totalUnits = Object.values(resources).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Sticky Top Header for Mobile & Desktop */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <PackageOpen size={24} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-slate-900 leading-none">Resource Matrix</h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">Hospital Unit Sync</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex flex-col items-end px-4 border-r border-slate-200">
              <span className="text-[10px] uppercase tracking-tighter font-bold text-slate-400">Network Supply</span>
              <span className="text-lg font-black text-slate-800">{totalUnits} <small className="text-xs font-semibold">Units</small></span>
            </div>
            
            <motion.button
              onClick={handleSave}
              disabled={saving}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                saved ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              <span className="hidden xs:inline">{saving ? "Syncing..." : saved ? "Saved!" : "Save Changes"}</span>
              <span className="xs:hidden">{saved ? "Done" : "Save"}</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8 space-y-6">
        {/* Alert Banner */}
        <AnimatePresence mode="wait">
          {lowStockItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-4">
                <div className="shrink-0 w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-md">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-rose-800 font-bold text-sm uppercase tracking-wider">Critical Shortage</h4>
                  <p className="text-rose-600 text-sm truncate">
                    Refill needed: {lowStockItems.map(i => i.label).join(", ")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {RESOURCES_CONFIG.map((config, idx) => (
            <ResourceCard
              key={config.key}
              config={config}
              value={resources[config.key] || 0}
              onAdjust={(amt) => adjustValue(config.key, amt)}
              onChange={(val) => handleChange(config.key, val)}
              delay={idx}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

// Sub-component for better performance and readability
function ResourceCard({ config, value, onAdjust, onChange, delay }) {
  const pct = Math.min(100, Math.round((value / config.max) * 100));
  const isLow = value <= config.alertThreshold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05 }}
      className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-blue-200 transition-colors shadow-sm group"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${config.gradient} shadow-lg shadow-slate-100`}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 tracking-tight">{config.label}</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goal: {config.max} {config.unit}</span>
          </div>
        </div>
        <div className={`text-2xl font-black ${isLow ? 'text-rose-500' : 'text-slate-900'}`}>
          {pct}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 w-full bg-slate-100 rounded-full mb-6 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
        />
      </div>

      {/* Control Group */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
        <button
          onClick={() => onAdjust(-1)}
          className="h-12 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
        >
          <Minus size={18} strokeWidth={3} />
        </button>
        
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-center text-lg font-black text-slate-800 outline-none w-full"
        />

        <button
          onClick={() => onAdjust(1)}
          className="h-12 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 transition-all active:scale-90"
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  );
}