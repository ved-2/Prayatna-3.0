"use client";

import { useState } from "react";
import { X, AlertTriangle, MapPin, Loader2, CheckCircle2, ChevronLeft, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const SYMPTOMS = [
  { id: "chest_pain", label: "Chest Pain", icon: "❤️", desc: "Heart attack suspected" },
  { id: "accident", label: "Trauma / Accident", icon: "🚑", desc: "Physical injury or crash" },
  { id: "breathing", label: "Breathing Difficulty", icon: "💨", desc: "Asthma, choking, restricted air" },
  { id: "unconscious", label: "Unconscious Node", icon: "🛌", desc: "Patient unresponsive" },
  { id: "burn", label: "Severe Burn", icon: "🔥", desc: "Chemical or thermal burns" },
  { id: "stroke", label: "Stroke Signs", icon: "🧠", desc: "Face drooping, arm weakness" },
];

export default function SosPageWeb() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDispatch = async () => {
    if (!selectedSymptom) {
       alert("Please select the nature of your emergency first.");
       return;
    }
    
    setIsDispatching(true);
    try {
      const symptomLabel = SYMPTOMS.find(s => s.id === selectedSymptom)?.label;
      
      await addDoc(collection(db, "transferRequests"), {
        type: "citizen_sos",
        patientName: user?.displayName || user?.email?.split('@')[0] || "Citizen",
        citizenId: user?.uid || "anonymous",
        patientAge: 30, // Mock, would normally pull from user profile
        severity: "critical",
        specialization: selectedSymptom === "chest_pain" ? "Cardiology" : "Trauma Care",
        notes: `EMERGENCY SOS DISPATCH INITIATED: ${symptomLabel}`,
        location: "110, Manglaya Sadak, Indore", // Mock GPS reverse geocoded
        gpsLat: 22.7196,
        gpsLng: 75.8577,
        status: "pending",
        createdAt: serverTimestamp()
      });
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/citizen");
      }, 4000);
      
    } catch (error) {
      console.error("SOS Dispatch failed", error);
      alert("Failed to connect to emergency network.");
      setIsDispatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-8 backgroundImage">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-rose-600/10 blur-[120px]" />
         <div className="absolute top-[40%] text-rose-500/5 left-1/2 -translate-x-1/2 -translate-y-1/2">
             <ShieldAlert size={800} />
         </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden relative z-10"
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="p-16 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-full flex justify-center items-center shadow-inner shadow-emerald-200">
                <CheckCircle2 size={64} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Signal Received.</h2>
              <p className="text-lg text-slate-500 max-w-sm">
                Emergency protocol initiated. An ambulance and first responders have been dispatched to your exact location.
              </p>
              <div className="mt-8 px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500">
                Redirecting to dashboard...
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className="bg-rose-600 text-white p-6 sm:px-10 flex items-center justify-between border-b-4 border-rose-700">
                <Link href="/citizen">
                   <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition backdrop-blur-md">
                     <ChevronLeft size={24} />
                   </button>
                </Link>
                <div className="text-center flex-1">
                   <h1 className="text-2xl sm:text-3xl font-black tracking-widest uppercase flex justify-center items-center gap-2">
                       <AlertTriangle className="animate-pulse" /> Emergency SOS
                   </h1>
                </div>
                <div className="w-10" /> {/* Spacer */}
              </div>

              <div className="p-6 sm:p-10">
                
                {/* Location Bar */}
                <div className="bg-slate-50 border flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl mb-8 shadow-sm border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <MapPin size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Deployment Coordinates</p>
                    <p className="text-base font-bold text-slate-800 leading-tight">110, Manglaya Sadak, Indore</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold shrink-0 self-start sm:self-auto border border-emerald-200">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    GPS Locked
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Identify the core emergency:</h2>
                  <p className="text-sm text-slate-500 mb-6">This helps dispatch the properly equipped ambulance.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {SYMPTOMS.map((sym) => {
                      const isSelected = selectedSymptom === sym.id;
                      return (
                        <button
                          key={sym.id}
                          onClick={() => setSelectedSymptom(sym.id)}
                          className={`p-5 rounded-2xl text-left transition-all border-2 relative overflow-hidden flex flex-col ${
                            isSelected 
                              ? "bg-rose-50 border-rose-500 shadow-md shadow-rose-200 ring-4 ring-rose-500/20" 
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                             <span className="text-3xl bg-white/50 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100/50 shadow-sm">{sym.icon}</span> 
                             {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                   <CheckCircle2 size={24} className="text-rose-600 fill-white" />
                                </motion.div>
                             )}
                          </div>
                          <span className={`font-bold text-base mt-2 ${isSelected ? 'text-rose-900' : 'text-slate-800'}`}>{sym.label}</span>
                          <span className={`text-xs mt-1 ${isSelected ? 'text-rose-600/80' : 'text-slate-400'}`}>{sym.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Dispatch Action */}
                <motion.button 
                  whileHover={selectedSymptom ? { scale: 1.02 } : {}}
                  whileTap={selectedSymptom ? { scale: 0.98 } : {}}
                  disabled={isDispatching || !selectedSymptom}
                  onClick={handleDispatch}
                  className={`w-full py-6 rounded-2xl text-white font-black text-lg tracking-widest uppercase flex items-center justify-center gap-3 transition-all ${
                    isDispatching || !selectedSymptom
                      ? "bg-slate-300 cursor-not-allowed shadow-none" 
                      : "bg-[#dc2626] hover:bg-red-700 shadow-[0_10px_30px_rgba(239,68,68,0.4)] border-b-4 border-red-900 active:border-b-0 active:translate-y-1"
                  }`}
                >
                  {isDispatching ? (
                    <Loader2 className="animate-spin" size={28} />
                  ) : (
                    <AlertTriangle fill="currentColor" className={selectedSymptom ? "text-red-900/30" : "text-white/40"} size={28} />
                  )}
                  {isDispatching ? "Establishing Link..." : !selectedSymptom ? "Select Emergency Protocol" : "Dispatch Emergency Request"}
                </motion.button>

                <p className="text-center text-xs text-slate-400 font-bold mt-4 uppercase tracking-widest">
                   Mishandling SOS protocols is punishable by law.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
