"use client";

import { motion } from "framer-motion";
import { Bell, MapPin, PhoneCall, AlertTriangle, PlusSquare, HeartPulse, Clock, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";

// Dynamically import the Leaflet map so it doesn't break SSR
const CitizenMap = dynamic(() => import("@/components/citizen/CitizenMap"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] rounded-3xl bg-slate-100 animate-pulse flex items-center justify-center border border-slate-200">
      <span className="text-slate-400 font-bold text-sm tracking-widest uppercase">Initializing Secure Map Node...</span>
    </div>
  )
});

export default function CitizenDashboardWeb() {
  const { user } = useAuth();
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    async function fetchHospitals() {
      try {
        const q = query(collection(db, "hospitals"), limit(5));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNearbyHospitals(data);
      } catch (err) {
        console.error("Error fetching hospitals:", err);
      }
    }
    fetchHospitals();
  }, []);

  // Use the authenticated user's name or fallback
  const displayName = user?.displayName || user?.email?.split('@')[0] || "Citizen";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* ── Wide Header Section ── */}
      <div className="bg-[#1a2332] text-white pt-10 pb-20 px-6 sm:px-12 lg:px-24 shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              Hello, {displayName} <span className="text-3xl animate-wave origin-bottom-right inline-block">👋</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-2">Connected to the central healthcare grid. Help is one click away.</p>
          </motion.div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/5 text-sm font-bold flex items-center gap-2">
              <FileText size={16} /> View Records
            </button>
            <button className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/5 flex items-center justify-center relative">
               <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
               <Bell size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Responsive Grid content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Quick Stats & SOS */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">

            {/* Emergency SOS Web Card */}
            <motion.div 
               whileHover={{ y: -2 }}
               className="bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-500/10 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <HeartPulse size={120} className="text-rose-500" />
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 mb-2">Emergency Hub</h2>
              <p className="text-slate-500 text-sm mb-8">Dispatch the nearest available ambulance immediately to your live coordinates.</p>
              
              <Link href="/citizen/sos" className="w-full">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#ef4444] text-white rounded-2xl py-6 flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(239,68,68,0.4)] relative group"
                >
                  <div className="absolute inset-0 rounded-2xl border border-red-400 animate-pulse opacity-50 block" />
                  <HeartPulse size={36} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-2xl tracking-widest leading-none">SOS</span>
                  <span className="text-xs font-bold text-red-200 mt-2 tracking-wide uppercase">Request Deployment</span>
                </motion.button>
              </Link>
            </motion.div>

            {/* Current Location Web Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <MapPin size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Geo-Node</p>
                  <p className="text-base font-bold text-slate-800 leading-tight">Sector 14,<br/>Chandigarh Network</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </div>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase">Update</button>
              </div>
            </motion.div>

            {/* Medical Quick View Web Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <PlusSquare size={18} className="text-blue-600" /> Medical Profile
                </h3>
                <span className="bg-rose-100 text-rose-600 font-bold px-3 py-1 rounded-xl text-sm border border-rose-200">Blood: O+</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-1 hover:border-blue-100 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                     <AlertTriangle size={12}/> Conditions
                  </p>
                  <p className="text-sm font-bold text-slate-700">None Recorded</p>
                </div>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-1 hover:border-blue-100 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                     <AlertTriangle size={12}/> Allergies
                  </p>
                  <p className="text-sm font-bold text-rose-600">Peanuts</p>
                </div>
                <div className="col-span-2 bg-slate-50 rounded-2xl border border-slate-100 p-4 flex justify-between items-center hover:border-blue-100 transition-colors">
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1">
                        <PhoneCall size={12}/> Emergency Contact
                     </p>
                     <p className="text-sm font-bold text-slate-700">Mother (ICE)</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                    +91 9876543210
                  </p>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Live Hospitals */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    Nearby Health Facilities
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Real-time capacity directly from the hospital network.</p>
                </div>
                
                {/* View Toggle */}
                <div className="flex bg-slate-200/50 p-1 rounded-xl self-start sm:self-auto">
                  <button 
                    onClick={() => setShowMap(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!showMap ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    List View
                  </button>
                  <button 
                    onClick={() => setShowMap(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${showMap ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Map View
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-4 h-[600px] overflow-y-auto custom-scrollbar flex-col flex">
                {showMap ? (
                   <div className="w-full h-full pb-8">
                     <CitizenMap hospitals={nearbyHospitals} />
                   </div>
                ) : (
                  <>
                    {/* Seed Data for visual match */}
                    <div className="bg-white rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 border-2 border-emerald-100 hover:border-emerald-300 transition-colors shadow-sm relative overflow-hidden group shrink-0">
                      <div className="absolute inset-0 bg-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                        <PlusSquare size={26} className="text-emerald-600 fill-emerald-600/20" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <h4 className="font-bold text-slate-900 text-lg md:text-xl truncate">City General Hospital</h4>
                           <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Closest</span>
                        </div>
                        <p className="text-sm text-slate-500 truncate">123 Medical Avenue • 2.4km Away</p>
                      </div>
                      
                      <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 mt-2 md:mt-0">
                         <div className="flex gap-2">
                            <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 text-center">
                              <span className="block text-lg leading-none mb-0.5">2</span> ICU Beds
                            </div>
                            <div className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 text-center">
                              <span className="block text-lg leading-none mb-0.5">5</span> Doctors
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Firestore Real Hospitals */}
                    {nearbyHospitals.length === 0 && (
                       <div className="text-center py-10 text-slate-400">Loading live network data...</div>
                    )}
                    
                    {nearbyHospitals.map(hosp => (
                      <div key={hosp.id} className="bg-white rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 border border-slate-200 hover:border-blue-300 transition-colors shadow-sm group shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:scale-105 transition-all">
                          <PlusSquare size={26} className="text-blue-600 fill-blue-600/20 group-hover:text-white group-hover:fill-white/20 transition-colors" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-lg md:text-xl truncate">{hosp.hospitalName || hosp.name || "Regional Hospital"}</h4>
                          <p className="text-sm text-slate-500 truncate mt-1 flex items-center gap-1.5">
                             <MapPin size={14}/> {hosp.address || "Local District"}
                          </p>
                        </div>
                        
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 mt-2 md:mt-0 opacity-80 group-hover:opacity-100 transition-opacity">
                           <div className="flex gap-2">
                              <div className="bg-slate-50 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                                <span className="block text-lg text-slate-800 leading-none mb-0.5">{hosp.beds?.icu?.available || 0}</span> ICU
                              </div>
                               <div className="bg-slate-50 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                                <span className="block text-lg text-slate-800 leading-none mb-0.5">{hosp.beds?.general?.available || 0}</span> Normal
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
