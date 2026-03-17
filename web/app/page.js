"use client";

import React, { useState, useMemo } from "react";
import {
  Activity, Building2, Users, AlertCircle,
  TrendingUp, MapPin, Clock, ArrowRight,
  CheckCircle2, Shield, Zap, Menu, Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// --- Mock Data ---
const hospitalsSeed = [
  { id: "h-1", name: "Apex Multispeciality", city: "South Delhi", status: "green", distance: 3.4, beds: 4, specialty: "Cardiology" },
  { id: "h-2", name: "CityCare Govt", city: "Noida", status: "amber", distance: 7.8, beds: 2, specialty: "Trauma Care" },
  { id: "h-3", name: "Metro Heart & Neuro", city: "Central Delhi", status: "red", distance: 5.2, beds: 1, specialty: "Neurology" },
];

// --- Sub-Components ---

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">{trend}</span>
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

// --- Main Page Component ---

export default function LandingPage() {
  const [activePortal, setActivePortal] = useState("citizen");
  const [location, setLocation] = useState("Lajpat Nagar, Delhi");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">


      {/* Hero Section */}
      <header className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-6 border border-blue-100"
          >
            <Zap size={14} fill="currentColor" />
            LIVE CAPACITY BROADCASTING ENABLED
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]"
          >
            Every second counts. <br />
            <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Direct routing</span> saves lives.
          </motion.h1 >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto"
          >
            HospiConnect turns fragmented hospital data into a real-time care network.
            Find open ICU beds, specialized trauma units, and live ambulances in one click.
          </motion.p>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/hospital/dashboard">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
              Monitor Now
            </button>
          </Link>
        </div>
      </header>

      {/* Bento Stats */}
      <section className="max-w-7xl mx-auto px-4 mb-20 grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Partner Hospitals" value="142" trend="+12%" color="bg-blue-100 text-blue-600" />
        <StatCard icon={Users} label="Active Requests" value="1,284" trend="+4%" color="bg-orange-100 text-orange-600" />
        <StatCard icon={Activity} label="Live ICU Beds" value="84" trend="-2%" color="bg-green-100 text-green-600" />
        <StatCard icon={Clock} label="Avg. Routing Time" value="4.2m" trend="-18%" color="bg-purple-100 text-purple-600" />
      </section>

      {/* Main Interactive Section */}
      <section className="max-w-7xl mx-auto px-4 pb-32">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-2">
            <button
              onClick={() => setActivePortal("citizen")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition ${activePortal === 'citizen' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Users size={18} /> Citizen Portal
            </button>
            <button
              onClick={() => setActivePortal("hospital")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition ${activePortal === 'hospital' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Building2 size={18} /> Hospital Operations
            </button>
          </div>

          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {activePortal === "citizen" ? (
                <motion.div
                  key="citizen"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-12"
                >
                  {/* Left: Search Form */}
                  <div className="lg:col-span-5 space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Find Emergency Care</h2>
                      <p className="text-slate-500 text-sm">Real-time matching based on symptoms and location.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Type</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition">
                          <option>Cardiac (Heart Distress)</option>
                          <option>Trauma (Accident)</option>
                          <option>Maternity Care</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                        Scan Local Network <ArrowRight size={18} />
                      </button>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-4">
                      <AlertCircle className="text-orange-600 shrink-0" />
                      <p className="text-xs text-orange-800 leading-relaxed">
                        <b>Critical Notice:</b> High volume reported in North Delhi due to local incidents. Expect slight delays in ambulance dispatch.
                      </p>
                    </div>
                  </div>

                  {/* Right: Live Results */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold flex items-center gap-2">
                        Recommended Facilities <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">3 Live Matches</span>
                      </h3>
                      <button className="text-xs text-blue-600 font-bold hover:underline">View Map</button>
                    </div>

                    {hospitalsSeed.map((hospital, i) => (
                      <div key={hospital.id} className={`p-5 rounded-2xl border transition-all ${i === 0 ? 'border-blue-200 bg-blue-50/30 ring-1 ring-blue-100' : 'border-slate-100 hover:border-slate-200 bg-white shadow-sm'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${hospital.status === 'green' ? 'bg-green-100 text-green-600' : hospital.status === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                              #{i + 1}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{hospital.name}</h4>
                              <p className="text-sm text-slate-500">{hospital.city} • {hospital.specialty}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">{hospital.distance} km</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Distance</div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex gap-6">
                            <div className="flex items-center gap-2 text-xs font-semibold">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              {hospital.beds} ICU Beds Avail.
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                              <Clock size={14} /> 12m Response
                            </div>
                          </div>
                          <button className="bg-white border border-slate-200 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition">
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="hospital"
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="bg-blue-50 p-6 rounded-full mb-6">
                    <Building2 className="w-12 h-12 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-extrabold mb-4">Central Dashboard for Facilities</h2>
                  <p className="text-slate-500 max-w-lg mx-auto mb-8">
                    Broadcast your live bed count, manage emergency handoffs, and coordinate with the city-wide ambulance network.
                  </p>
                  <div className="flex gap-4">
                    <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-xl shadow-slate-200">
                      Enter Dashboard
                    </button>
                    <button className="bg-white border border-slate-200 px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition">
                      View Protocol
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Trust Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-slate-400">
            <Activity size={20} />
            HOSPICONNECT NETWORK © 2026
          </div>
          <div className="flex gap-12 text-xs font-bold text-slate-400 tracking-widest uppercase">
            <div className="flex items-center gap-2"><Shield size={16} /> ISO 27001 Certified</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={16} /> HIPAA Compliant</div>
            <div className="flex items-center gap-2"><TrendingUp size={16} /> Real-time Nodes</div>
          </div>
        </div>
      </footer>
    </div>
  );
}