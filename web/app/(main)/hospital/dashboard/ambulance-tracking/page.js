"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
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

// --- Formatting Helpers ---
const formatDistance = (meters) => {
  if (!meters) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "< 1 min";
  return `${mins} min`;
};

// --- OSRM & Fallback Helpers ---
const haversineDist = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // returns meters
};

const fetchOSRMRoute = async (start, end) => {
  if (!start.lat || !start.lng || !end.lat || !end.lng) return null;
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);

    if (!res.ok) throw new Error(`OSRM Status ${res.status}`);
    
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        points: route.geometry.coordinates.map(c => [c[1], c[0]]),
        distance: route.distance,
        duration: route.duration
      };
    }
  } catch (e) {
    console.warn("🔀 OSRM Fetch Failed, using straight-line fallback:", e.message);
    const dist = haversineDist(start.lat, start.lng, end.lat, end.lng);
    return {
      points: [[start.lat, start.lng], [end.lat, end.lng]],
      distance: dist,
      duration: (dist / 1000) / 45 * 3600 // Estimate: 45km/h in seconds
    };
  }
  return null;
};

// --- Status Meta ---
function statusMeta(amb, emergency) {
  const status = emergency?.status || amb.dispatchStatus;
  const isPatientOnboard = status === "patientOnboard" || amb.patientOnboard;

  if (isPatientOnboard) {
    return { label: "Patient On Board", background: "#fef2f2", color: "#991b1b" };
  }
  if (emergency) {
    return { label: "Assigned", background: "#fff7ed", color: "#9a3412" };
  }
  return { label: "Available", background: "#f0fdf4", color: "#065f46" };
}

export default function AmbulanceTrackingPage() {
  const { user } = useAuth();
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hospitalLocation, setHospitalLocation] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    // Listen to ambulances
    const q = query(collection(db, "ambulances"), where("hospitalId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setAmbulances(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // Fetch hospital location
    const hospRef = doc(db, "hospitals", user.uid);
    const unsubHosp = onSnapshot(hospRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        let lat = data.gpsLat;
        let lng = data.gpsLng;
        
        // Handle geoloc object fallback (for Unicare/legacy records)
        if (!lat && data.geoloc) {
          lat = data.geoloc.latitude;
          lng = data.geoloc.longitude;
        }

        if (lat && lng) {
          setHospitalLocation({ lat: Number(lat), lng: Number(lng) });
        }
      }
    });

    return () => {
      unsub();
      unsubHosp();
    };
  }, [user]);

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#64748b]">
            Live Tracking
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#0f172a]">
          Ambulance Tracking
        </h1>
        <p className="text-sm mt-1 text-[#64748b]">
          {ambulances.length} ambulance{ambulances.length !== 1 ? "s" : ""} assigned to this hospital
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ambulances.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-white border border-[#e2e8f0]">
          <CheckCircle size={48} className="text-green-400 mb-3" />
          <p className="text-lg font-bold text-[#0f172a]">No ambulances currently</p>
          <p className="text-sm mt-1 text-[#94a3b8]">Ambulances assigned to your hospital will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence>
            {ambulances.map((amb, i) => (
              <AmbulanceTrackerCard 
                key={amb.id} 
                amb={amb} 
                index={i} 
                hospitalLocation={hospitalLocation} 
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function AmbulanceTrackerCard({ amb, index, hospitalLocation }) {
  const [emergency, setEmergency] = useState(null);
  const [routeInfo, setRouteInfo] = useState({
    leg1: [],
    leg2: [],
    distanceText: null,
    etaText: null
  });

  // Listen to the current emergency assigned to this ambulance
  useEffect(() => {
    if (!amb.currentEmergencyId) {
      setEmergency(null);
      return;
    }
    const unsub = onSnapshot(doc(db, "emergencies", amb.currentEmergencyId), (snap) => {
      if (snap.exists()) setEmergency({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [amb.currentEmergencyId]);

  // Route & ETA calculation logic
  useEffect(() => {
    const ambLoc = { lat: Number(amb.gpsLat), lng: Number(amb.gpsLng) };
    if (!ambLoc.lat || !ambLoc.lng) return;

    const updateRoutes = async () => {
      // CASE 1: Active Emergency tracking
      if (emergency) {
        let pLat = emergency.latitude || emergency.lat;
        let pLng = emergency.longitude || emergency.lng;

        // Geoloc object fallback
        if (!pLat && emergency.geoloc) {
          pLat = emergency.geoloc.latitude;
          pLng = emergency.geoloc.longitude;
        }

        if (pLat && pLng) {
          const patientLoc = { lat: Number(pLat), lng: Number(pLng) };
          
          let hLat = emergency.hospitalLat;
          let hLng = emergency.hospitalLng;
          const hLoc = (hLat && hLng) 
            ? { lat: Number(hLat), lng: Number(hLng) } 
            : hospitalLocation;

          const isPatientOnboard = emergency.status === "patientOnboard" || amb.patientOnboard;

          if (isPatientOnboard) {
            // Mission Leg: Current -> Hospital
            if (hLoc) {
              const route = await fetchOSRMRoute(ambLoc, hLoc);
              if (route) {
                setRouteInfo({
                  leg1: route.points,
                  leg2: [],
                  distanceText: formatDistance(route.distance),
                  etaText: formatDuration(route.duration)
                });
              }
            }
          } else {
            // Legs: Amb -> Patient and Patient -> Hospital
            const leg1 = await fetchOSRMRoute(ambLoc, patientLoc);
            let leg2Points = [];
            if (hLoc) {
              const leg2 = await fetchOSRMRoute(patientLoc, hLoc);
              if (leg2) leg2Points = leg2.points;
            }

            if (leg1) {
              setRouteInfo({
                leg1: leg1.points,
                leg2: leg2Points,
                distanceText: formatDistance(leg1.distance),
                etaText: formatDuration(leg1.duration)
              });
            }
          }
          return;
        }
      }

      // CASE 2: No active emergency, show route to hospital (returning home)
      if (hospitalLocation) {
        const route = await fetchOSRMRoute(ambLoc, hospitalLocation);
        if (route) {
          setRouteInfo({
            leg1: route.points,
            leg2: [],
            distanceText: formatDistance(route.distance),
            etaText: formatDuration(route.duration)
          });
        }
      } else {
        setRouteInfo({ leg1: [], leg2: [], distanceText: null, etaText: null });
      }
    };

    updateRoutes();
  }, [amb.gpsLat, amb.gpsLng, emergency?.status, amb.currentEmergencyId, hospitalLocation]);

  const meta = statusMeta(amb, emergency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-2xl overflow-hidden bg-white border border-[#e2e8f0] shadow-sm"
    >
      <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10">
            <Ambulance size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white">
              {amb.ambulanceId || `AMB-${amb.id.slice(0, 5).toUpperCase()}`}
            </p>
            <p className="text-xs text-[#94a3b8]">Unit ID</p>
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
          label="Estimated ETA"
          value={routeInfo.etaText || "—"}
          color="#f59e0b"
        />
        <InfoField
          icon={MapPin}
          label="Location"
          value={amb.location || "GPS Signal Active"}
        />
        <InfoField
          icon={Route}
          label="Distance left"
          value={routeInfo.distanceText || "—"}
        />
      </div>

      <div className="mx-5 mb-5 rounded-xl overflow-hidden h-48 relative z-0 border border-[#e2e8f0]">
        {amb.gpsLat && amb.gpsLng ? (
          <DynamicLiveMap
            lat={amb.gpsLat}
            lng={amb.gpsLng}
            popupText={`Ambulance ${amb.ambulanceId || amb.id.slice(0, 5).toUpperCase()}`}
            routePointsLeg1={routeInfo.leg1}
            routePointsLeg2={routeInfo.leg2}
            patientLocation={emergency ? { lat: emergency.latitude || emergency.lat, lng: emergency.longitude || emergency.lng } : null}
            hospitalLocation={emergency?.hospitalLat ? { lat: emergency.hospitalLat, lng: emergency.hospitalLng } : hospitalLocation}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50">
            <MapPin size={28} className="text-[#94a3b8] mb-1" />
            <p className="text-xs font-medium text-[#94a3b8]">Waiting for GPS...</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InfoField({ icon: Icon, label, value, color = "#0f172a" }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={12} className="text-[#94a3b8]" />
        <span className="text-xs text-[#94a3b8]">{label}</span>
      </div>
      <p className="text-sm font-bold truncate" style={{ color }}>{value}</p>
    </div>
  );
}
