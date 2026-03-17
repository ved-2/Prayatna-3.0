"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, getDocs, addDoc, updateDoc, doc, serverTimestamp, setDoc, increment } from "firebase/firestore";
import { collection, query, where, onSnapshot, getDocs, addDoc, updateDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Handshake, ShieldAlert, Info, Loader2, Hospital, ArrowRightLeft, UserCircle, Activity, Paperclip, X, FileText, Sparkles, MapPin } from "lucide-react";



import { Send, Handshake, ShieldAlert, Info, Loader2, Hospital, ArrowRightLeft, UserCircle, Activity } from "lucide-react";
import { toast } from "sonner";

const SEVERITY_LEVELS = [
  { key: "critical", label: "Critical", color: "text-rose-600", bg: "bg-rose-50" },
  { key: "high", label: "High", color: "text-amber-600", bg: "bg-amber-50" },
  { key: "moderate", label: "Moderate", color: "text-blue-600", bg: "bg-blue-50" },
];

const SPECIALIZATIONS = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "General Surgery",
  "ICU / Life Support",
  "Burn Ward",
  "Other"
];

export default function PatientTransferPage() {
  const { user } = useAuth();
  
  // Form State
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [severity, setSeverity] = useState("high");
  const [specializations, setSpecializations] = useState(["ICU / Life Support"]);
  const [notes, setNotes] = useState("");
  const [targetHospitalId, setTargetHospitalId] = useState("");
  
  const [sendingStatus, setSendingStatus] = useState(""); 
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Data State
  const [otherHospitals, setOtherHospitals] = useState([]);
  const [currentHospital, setCurrentHospital] = useState(null);
  const [hospitalDoctors, setHospitalDoctors] = useState([]);
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [outgoingTransfers, setOutgoingTransfers] = useState([]);
  const [patientQueue, setPatientQueue] = useState([]);
  const [allNetworkDoctors, setAllNetworkDoctors] = useState([]);
  const [loading, setLoading] = useState(true);


  // Fetch data
  useEffect(() => {
    if (!user) return;

    // 1. Fetch other hospitals
    const fetchHospitals = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "hospitals"));
        const hospitalsData = [];
        let currHosp = null;
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id !== user.uid) { 
            hospitalsData.push({ id: docSnap.id, ...docSnap.data() });
          } else {
            currHosp = docSnap.data();
          }
        });
        setOtherHospitals(hospitalsData);
        if (currHosp) setCurrentHospital(currHosp);
        if (hospitalsData.length > 0) {
          setTargetHospitalId(hospitalsData[0].id);
        }
      } catch (error) {
        console.error("Error fetching hospitals:", error);
      }
    };
    fetchHospitals();

    // 2. Incoming Requests (type: patient)
    const incomingQ = query(
      collection(db, "transferRequests"),
      where("toHospital", "==", user.uid),
      where("type", "==", "patient"),
      where("status", "==", "pending")
    );
    const unsubIncoming = onSnapshot(incomingQ, (snap) => {
      console.log("📥 Incoming patient transfers fetched:", snap.docs.length, "requests");
      snap.docs.forEach(doc => console.log("  - Request:", doc.data()));
      setIncomingTransfers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("❌ Error fetching incoming patient transfers:", error.message);
      if (error.message.includes("index")) {
        alert("⚠️ Firestore requires a composite index for this query. Check Firebase Console.");
      }
    });

    // 3. Outgoing Requests
    const outgoingQ = query(
      collection(db, "transferRequests"),
      where("fromHospital", "==", user.uid),
      where("type", "==", "patient")
    );
    const loadResponsesForTransfer = async (transferId) => {
      try {
        const resSnap = await getDocs(collection(db, "transferRequests", transferId, "responses"));
        const responses = resSnap.docs.map(d => d.data());
        if (!responses.length) return null;
        responses.sort((a, b) => (b.actedAt?.toMillis?.() || 0) - (a.actedAt?.toMillis?.() || 0));
        return responses[0];
      } catch (error) {
        console.warn("Unable to load response subcollection for transfer:", transferId, error.message);
        return null;
      }
    };

    const unsubOutgoing = onSnapshot(outgoingQ, async (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      console.log("📤 Outgoing patient transfers fetched:", docs.length, "requests");
      docs.forEach(doc => console.log("  - Request to:", getHospitalName(doc.toHospital), "Status:", doc.status));

      setOutgoingTransfers(docs);
      setLoading(false);

      // If the transfer request itself cannot be updated (due to permissions), we may have stored a response in a subcollection.
      // Fetch those responses and update the UI state accordingly.
      for (const transfer of docs) {
        const response = await loadResponsesForTransfer(transfer.id);
        if (response && transfer.status === "pending") {
          setOutgoingTransfers(prev => prev.map(t => t.id === transfer.id ? { ...t, status: response.status, response } : t));
        }
      }
    }, (error) => {
      console.error("❌ Error fetching outgoing patient transfers:", error.message);
    });

    const queueQ = query(collection(db, "patientQueue"), where("hospitalId", "==", user.uid));
    const unsubQueue = onSnapshot(queueQ, (snap) => {
      setPatientQueue(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("❌ Error fetching patient queue:", error.message);
    });

    const doctorsQ = query(collection(db, "doctors"), where("hospitalId", "==", user.uid));
    const unsubDoctors = onSnapshot(doctorsQ, (snap) => {
      setHospitalDoctors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("⚠️ Cannot fetch doctors (check Firebase rules):", error.message);
    });

    // 6. Fetch ALL Network Doctors to Power Global Auto-Routing
    const allDoctorsQ = collection(db, "doctors");
    const unsubAllDoctors = onSnapshot(allDoctorsQ, (snap) => {
      setAllNetworkDoctors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("⚠️ Cannot fetch global network doctors", error.message);
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
      unsubQueue();
      unsubDoctors();
      unsubAllDoctors();
    };
  }, [user]);

  // Send Transfer Request
  const handleSendTransfer = async (e) => {
    e.preventDefault();
    if (!user || !targetHospitalId || !patientName || !patientAge) return;

    setSendingStatus("Uploading Document Details...");

    setSendingStatus("Saving Request...");
    try {
      await addDoc(collection(db, "transferRequests"), {
        type: "patient",
        patientName,
        patientAge: parseInt(patientAge, 10),
        severity,
        specialization: specializations.join(" + "),
        specializationsArray: specializations,
        notes,
        fromHospital: user.uid,
        toHospital: targetHospitalId,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setRequestSuccess(true);
      setTimeout(() => setRequestSuccess(false), 3000);
      
      // Reset
      setPatientName("");
      setPatientAge("");
      setNotes("");
    } catch (error) {
      console.error("Error sending transfer:", error);
      toast.error("Transfer Dispatch Failed", {
        description: "Verify your connection or Firestore permissions."
      });
    } finally {
      setSendingStatus("");
    }
  };

  // Accept Transfer - Update status ONLY (no new documents)
  const handleAcceptTransfer = async (transferRequest) => {
    const transferId = transferRequest.id;

    const responseData = {
      status: "accepted",
      actedAt: serverTimestamp(),
      hospitalId: user.uid,
      hospitalName: getHospitalName(user.uid),
    };

    let updatedTransfer = false;

    try {
      // Try updating the transfer request directly first (requires appropriate Firestore rules)
      await updateDoc(doc(db, "transferRequests", transferId), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
        acceptedByHospital: user.uid,
      });
      updatedTransfer = true;

      // Start: Intelligent Doctor Assignment
      const doctorsQ = query(collection(db, "doctors"), where("hospitalId", "==", user.uid));
      const doctorsSnap = await getDocs(doctorsQ);
      const availableDoctors = [];
      doctorsSnap.forEach((docItem) => {
        const docData = docItem.data();
        if (docData.status === "available") { // Only look at doctors currently working and available
          availableDoctors.push({ id: docItem.id, ...docData });
        }
      });
      
      let assignedDoctorName = "Unassigned (No Available Staff)";
      let assignedDoctorIds = [];
      
      if (availableDoctors.length > 0) {
        const specs = transferRequest.specializationsArray || [transferRequest.specialization];
        const assignedDoctorsList = [];
        let doctorsPool = [...availableDoctors];
        
        specs.forEach(spec => {
          if(!spec) return;
          const matchIndex = doctorsPool.findIndex(
            d => d.specialization && (
              d.specialization.toLowerCase().includes(spec.toLowerCase().replace(/ogy$/, '').replace(/ist$/, '')) ||
              spec.toLowerCase().includes(d.specialization.toLowerCase().replace(/ogy$/, '').replace(/ist$/, ''))
            )
          );
          if (matchIndex !== -1) {
            const match = doctorsPool.splice(matchIndex, 1)[0];
            assignedDoctorsList.push(match);
            assignedDoctorIds.push(match.id);
          }
        });
        
        if (assignedDoctorsList.length > 0) {
          assignedDoctorName = assignedDoctorsList.map(d => `Dr. ${d.name} (${d.specialization})`).join(" + ");
        } else {
           // Fallback if none of the specific specialists are available
           assignedDoctorName = `Dr. ${availableDoctors[0].name} (Emergency Cover)`;
           assignedDoctorIds.push(availableDoctors[0].id);
        }
      }
      // End: Intelligent Doctor Assignment

      // Automatic Bed Management & Ward Assignment
      const isCritical = transferRequest.severity === 'critical' || transferRequest.specialization?.toLowerCase().includes('icu');
      const assignedWard = isCritical ? 'ICU Ward' : 'General Ward';

      try {
        if (isCritical) {
          await updateDoc(doc(db, "hospitals", user.uid), {
            "beds.icu.available": increment(-1),
            "beds.icu.occupied": increment(1)
          });
        } else {
          await updateDoc(doc(db, "hospitals", user.uid), {
            "beds.general.available": increment(-1),
            "beds.general.occupied": increment(1)
          });
        }
      } catch (bedErr) {
        console.error("Failed to update bed capacity automatically:", bedErr);
      }

      // If allowed, also create patient + queue entry (may also be blocked by rules)
      const patientRef = await addDoc(collection(db, "patients"), {
        name: transferRequest.patientName,
        age: transferRequest.patientAge,
        severity: transferRequest.severity,
        specialization: transferRequest.specialization,
        notes: transferRequest.notes || "",
        fromHospital: transferRequest.fromHospital,
        toHospital: transferRequest.toHospital,
        status: "transferred",
        transferRequestId: transferId,
        assignedDoctor: assignedDoctorName,
        assignedWard: assignedWard,
        acceptedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, "patientQueue"), {
        patientId: patientRef.id,
        patientName: transferRequest.patientName,
        age: transferRequest.patientAge,
        symptoms: `${transferRequest.severity} / ${transferRequest.specialization}`,
        assignedDoctor: assignedDoctorName,
        assignedWard: assignedWard,
        priority: transferRequest.severity === "critical" ? "critical" : transferRequest.severity === "high" ? "high" : "medium",
        arrivalTime: serverTimestamp(),
        hospitalId: user.uid,
        transferRequestId: transferId,
      });

      // Mark all assigned doctors as busy so they aren't double-assigned
      for (const doctorId of assignedDoctorIds) {
        try {
          await updateDoc(doc(db, "doctors", doctorId), { status: "busy" });
        } catch (doctorErr) {
          console.error("Failed to mark doctor as busy:", doctorErr);
        }
      }

      console.log(`✅ Transfer request ${transferId} accepted by Hospital ${user.uid}`);
    } catch (error) {
      // If updating the transfer request or writing queue data is blocked by rules, we still store a response record
      console.warn("⚠️ Permission denied updating transferRequests or writing queue:", error.code, error.message);
      try {
        await setDoc(doc(db, "transferRequests", transferId, "responses", user.uid), responseData, { merge: true });
      } catch (fallbackError) {
        console.error("❌ Critical: Failed to store response fallback:", fallbackError.code, fallbackError.message);
        console.error("Failed to store response fallback for transfer request:", fallbackError.message);
        alert("Permission Error: Check Firestore Security Rules.");
      }

      if (!updatedTransfer) {
        // If we couldn't update the transfer request itself, at least mark the local UI state so you can see it.
        setOutgoingTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: "accepted", response: responseData } : t));
      }
    }
  };

  // Reject Transfer - Update status ONLY (no new documents)
  const handleRejectTransfer = async (transferRequest) => {
    const transferId = transferRequest.id;
    const responseData = {
      status: "rejected",
      actedAt: serverTimestamp(),
      hospitalId: user.uid,
      hospitalName: getHospitalName(user.uid),
    };

    try {
      // Try updating the transfer request directly first
      await updateDoc(doc(db, "transferRequests", transferId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectedByHospital: user.uid,
      });

      console.log(`❌ Transfer request ${transferId} rejected by Hospital ${user.uid}`);
    } catch (error) {
      // Fallback: if we can't update transferRequests, store response in subcollection
      console.warn("Permission denied updating transferRequests; storing response in subcollection.", error.message);
      try {
        await setDoc(doc(db, "transferRequests", transferId, "responses", user.uid), responseData, { merge: true });
      } catch (fallbackError) {
        console.error("Failed to store rejection response fallback for transfer request:", fallbackError.message);
        alert("Permission Error: Check Firestore Security Rules.");
      }

      // Reflect status locally so the UI doesn't keep the request as pending.
      setOutgoingTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: "rejected", response: responseData } : t));
    }

    const alternative = findAlternativeHospital(transferRequest);
    if (alternative) {
      setTargetHospitalId(alternative);
      toast.info("Alternative Hospital Selected", {
        description: `Transfer rejected by ${getHospitalName(transferRequest.toHospital)}. Rerouting to ${getHospitalName(alternative)}.`
      });
    } else {
      toast.error("Transfer Rejected", {
        description: "No alternative hospitals found in the current zone."
      });
    }
  };

  const getHospitalName = (uid) => {
    const hosp = otherHospitals.find(h => h.id === uid);
    return hosp ? hosp.name || hosp.hospitalName || "Unknown Hospital" : "Unknown Hospital";
  };

  const findAlternativeHospital = (request) => {
    const excluded = new Set([request.toHospital, request.rejectedByHospital].filter(Boolean));
    const candidates = otherHospitals.filter(h => !excluded.has(h.id));
    if (!candidates.length) return null;

    const specialization = (request.specialization || "").toLowerCase();
    const needsIcu = specialization.includes("icu") || specialization.includes("life") || request.severity === "critical";
    const needsCardio = specialization.includes("cardio");

    const minRequirements = {
      beds: {
        icu: needsIcu ? 1 : 0,
        general: needsCardio ? 0 : 1,
      },
      resources: {
        ventilators: needsIcu || needsCardio ? 1 : 0,
        oxygen: 10,
        icuEquipment: needsIcu || needsCardio ? 1 : 0,
      },
    };

    const scored = candidates
      .map(h => {
        const beds = h.beds || {};
        const resources = h.resources || {};

        const bedScore = (beds.icu?.available ?? 0) + (beds.general?.available ?? 0) + (beds.emergency?.available ?? 0);
        const resScore = (resources.ventilators ?? 0) + (resources.oxygen ?? 0) + (resources.icuEquipment ?? 0) + (resources.emergencyKits ?? 0);
        const totalScore = bedScore + resScore;

        const meetsMin =
          (beds.icu?.available ?? 0) >= minRequirements.beds.icu &&
          (beds.general?.available ?? 0) >= minRequirements.beds.general &&
          (resources.ventilators ?? 0) >= minRequirements.resources.ventilators &&
          (resources.oxygen ?? 0) >= minRequirements.resources.oxygen &&
          (resources.icuEquipment ?? 0) >= minRequirements.resources.icuEquipment;

        return { id: h.id, score: totalScore, meetsMin };
      })
      .filter(h => h.score > 0)
      .sort((a, b) => {
        if (a.meetsMin !== b.meetsMin) return b.meetsMin ? 1 : -1;
        return b.score - a.score;
      });

    return scored[0]?.id ?? null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="animate-spin text-blue-500" size={36} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold flex items-center gap-3" style={{ color: "#0f172a" }}>
          <ArrowRightLeft className="text-emerald-500" size={32} />
          Patient Transfer Hub
        </h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Coordinate critical patient transfers across the regional healthcare network.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* ── Left Column: Send Request ── */}
        <div className="xl:col-span-5 space-y-8">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Send size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Initiate Transfer</h2>
            </div>

            <form onSubmit={handleSendTransfer} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Patient Name</label>
                  <input
                    type="text" required placeholder="John Doe"
                    value={patientName} onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Age</label>
                  <input
                    type="number" required placeholder="e.g. 45" min="0" max="150"
                    value={patientAge} onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Severity Level</label>
                <div className="flex gap-2">
                  {SEVERITY_LEVELS.map(sev => (
                    <button
                      type="button"
                      key={sev.key}
                      onClick={() => setSeverity(sev.key)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                        severity === sev.key 
                        ? `${sev.bg} ${sev.color} border-${sev.color.split('-')[1]}-300` 
                        : `bg-white text-slate-500 border-slate-200 hover:bg-slate-50`
                      }`}
                    >
                      {sev.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Required Specializations (Multi-Select)</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(spec => (
                    <button
                      type="button"
                      key={spec}
                      onClick={() => setSpecializations(prev => prev.includes(spec) && prev.length > 1 ? prev.filter(s => s !== spec) : prev.includes(spec) ? prev : [...prev, spec])}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        specializations.includes(spec) 
                        ? "bg-indigo-100 text-indigo-700 border-indigo-300 shadow-sm" 
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Medical Notes</label>
                <textarea
                  rows="2" placeholder="Brief condition description..."
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium resize-none"
                />
              </div>


              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Target Hospital</label>
                {otherHospitals.length === 0 ? (
                 <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <Info size={16}/> No other hospitals found in the network.
                 </div>
                ) : (
                  <select
                    value={targetHospitalId}
                    onChange={(e) => setTargetHospitalId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none font-semibold cursor-pointer"
                  >
                    {otherHospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name || h.hospitalName || "Unknown Hospital"} (ID: {h.id.slice(0,4)}...)</option>
                    ))}
                  </select>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                disabled={!!sendingStatus || otherHospitals.length === 0}
                type="submit"
                className={`w-full py-4 rounded-xl text-white font-bold flex justify-center items-center gap-2 transition-all ${requestSuccess ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-900 shadow-lg shadow-slate-900/20'} disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
              >
                {sendingStatus ? <Loader2 size={18} className="animate-spin" /> : requestSuccess ? <Handshake size={20} /> : <Send size={18} />}
                {sendingStatus ? sendingStatus : requestSuccess ? "Transfer Request Sent!" : "Broadcast Transfer Request"}
              </motion.button>
            </form>
          </motion.div>

        </div>

        {/* ── Right Column: Incoming & History ── */}
        <div className="xl:col-span-7 space-y-8">

          {/* Incoming Transers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-slate-900 rounded-3xl p-7 shadow-xl shadow-slate-900/10 border border-slate-800 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Activity size={180} />
            </div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-xl font-bold tracking-tight">Incoming Transfers</h2>
              <span className="ml-auto bg-rose-500/20 text-rose-400 py-1 px-3 text-xs font-bold rounded-full border border-rose-500/30">
                {incomingTransfers.length} Pending
              </span>
            </div>

            <div className="space-y-4 relative z-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {incomingTransfers.length === 0 ? (
                <div className="text-center py-8 text-slate-400/80 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
                  <UserCircle className="mx-auto mb-3 opacity-30" size={32} />
                  <p className="text-sm font-medium">No incoming patient transfers pending.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {incomingTransfers.map(req => {
                    const sevColor = req.severity === "critical" ? "text-rose-400" : req.severity === "high" ? "text-amber-400" : "text-blue-400";
                    
                    const specsRequired = req.specializationsArray || [req.specialization];
                    const missingSpecs = specsRequired.filter(spec => 
                      !hospitalDoctors.some(d => d.status === 'available' && (d.specialization?.toLowerCase().includes(spec.toLowerCase().replace(/ogy$/, '').replace(/ist$/, '')) || spec.toLowerCase().includes(d.specialization?.toLowerCase().replace(/ogy$/, '').replace(/ist$/, ''))))
                    );
                    const hasAllSpecialists = missingSpecs.length === 0;

                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        key={req.id}
                        className="bg-slate-800 border border-slate-700 p-5 rounded-2xl"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold mb-1 tracking-widest uppercase">From Hospital</p>
                            <p className="font-bold text-emerald-400 flex items-center gap-2 text-sm">
                              <Hospital size={14}/> {getHospitalName(req.fromHospital)}
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-[10px] text-slate-400 font-bold mb-1 tracking-widest uppercase">Patient Detail</p>
                            <div className="flex items-center sm:justify-end gap-2 font-black text-white text-lg">
                              {req.patientName} <span className="text-sm font-medium text-slate-400">({req.patientAge}y)</span>
                            </div>
                            <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${sevColor}`}>
                              {req.severity} • {req.specialization}
                            </p>
                          </div>
                        </div>

                        {req.notes && (
                          <div className="bg-slate-900/50 p-3 rounded-xl mb-4 border border-slate-700/50">
                            <p className="text-xs text-slate-300 italic">"{req.notes}"</p>
                          </div>
                        )}

                        <div className="bg-slate-900/50 p-3 rounded-xl mb-4 border border-slate-700/50">
                          <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-widest flex items-center justify-between">
                            <span>Your Live Capacity Checklist</span>
                            <span className="text-emerald-500 font-bold">Checking...</span>
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-center">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">ICU Beds</span>
                              <span className={`font-black text-sm ${(currentHospital?.beds?.icu?.available || 0) > 0 ? "text-emerald-400" : "text-amber-500"}`}>
                                {currentHospital?.beds?.icu?.available || 0} Open
                              </span>
                            </div>
                            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-center">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Gen Beds</span>
                              <span className={`font-black text-sm ${(currentHospital?.beds?.general?.available || 0) > 0 ? "text-emerald-400" : "text-amber-500"}`}>
                                {currentHospital?.beds?.general?.available || 0} Open
                              </span>
                            </div>
                            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-center">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Doctors</span>
                              <span className={`font-black text-sm ${hasAllSpecialists ? "text-emerald-400" : "text-amber-500"}`}>
                                {hasAllSpecialists ? "Team Available" : `Missing ${missingSpecs[0]}`}
                              </span>
                            </div>
                          </div>
                          {(currentHospital?.beds?.icu?.available === 0 && (req.severity === 'critical' || req.specialization.includes('ICU'))) && (
                            <p className="text-[10px] text-rose-400 mt-2 font-bold flex items-center gap-1 bg-rose-500/10 p-1.5 rounded">
                              <ShieldAlert size={12}/> Warning: You have 0 ICU beds available for this critical patient.
                            </p>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button 
                            disabled={!hasAllSpecialists}
                            onClick={() => handleAcceptTransfer(req)} 
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-emerald-500 flex items-center justify-center gap-2"
                            title={!hasAllSpecialists ? `Missing specialist: ${missingSpecs.join(', ')}` : "Accept Patient"}
                          >
                            {!hasAllSpecialists && <ShieldAlert size={16} />}
                            {hasAllSpecialists ? "Accept Patient" : "Team Required"}
                          </button>
                          <button onClick={() => handleRejectTransfer(req)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                            Decline
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {/* Patient Queue (Accepted Transfers) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-6">Accepted Transfers / Patient Queue</h2>
            <p className="text-sm text-slate-500 mb-4">This list shows patients accepted by your hospital (from transfer requests).</p>
            {patientQueue.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-4">No patients in queue yet.</p>
            ) : (
              <div className="space-y-3">
                {patientQueue.map(p => (
                  <div key={p.id} className="flex flex-col p-5 bg-slate-50 rounded-2xl border border-slate-200 transition-shadow hover:shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{p.patientName} <span className="text-xs font-medium text-slate-400">({p.age}y)</span></p>
                        <p className="text-xs text-slate-500 font-semibold">{p.symptoms}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                          Admitted: {p.arrivalTime?.toDate ? p.arrivalTime.toDate().toLocaleString() : "Just now"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50 shadow-sm shrink-0">In Queue</span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Outgoing Transfers History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-6">Your Transfer History</h2>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {outgoingTransfers.length === 0 ? (
                <p className="text-sm text-slate-500 italic text-center py-4">You have not initiated any transfers.</p>
              ) : (
                outgoingTransfers.map(req => {
                   const statusColors = {
                     pending: "bg-amber-100 text-amber-700 border-amber-200",
                     accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
                     rejected: "bg-rose-100 text-rose-700 border-rose-200"
                   };
                   
                   return (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                          <UserCircle size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 text-sm">{req.patientName} <span className="text-slate-400 font-medium">({req.patientAge}y)</span></p>
                          <p className="text-xs text-slate-500 font-bold tracking-wide mt-0.5">To: <span className="text-blue-600">{getHospitalName(req.toHospital)}</span></p>
                          {req.status === "rejected" && req.rejectedByHospital && (
                            <p className="text-xs text-rose-600 font-semibold mt-1">
                              ❌ Rejected by: {getHospitalName(req.rejectedByHospital)}
                            </p>
                          )}
                          {req.status === "accepted" && req.acceptedByHospital && (
                            <p className="text-xs text-emerald-600 font-semibold mt-1">
                              ✅ Accepted by: {getHospitalName(req.acceptedByHospital)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-2.5 py-1 flex items-center justify-center rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[req.status] || statusColors.pending}`}>
                          {req.status}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{req.specialization}</span>
                        {req.status === "rejected" && (
                          <button 
                            onClick={() => {
                              setPatientName(req.patientName);
                              setPatientAge(req.patientAge.toString());
                              setSeverity(req.severity);
                              setSpecialization(req.specialization);
                              setNotes(req.notes);

                              const alternative = findAlternativeHospital(req);
                              if (alternative) {
                                setTargetHospitalId(alternative);
                                toast.success("Draft Restored", {
                                   description: `Auto-selected hospital: ${getHospitalName(alternative)}. You can resend the request.`
                                });
                              } else {
                                toast.info("Draft Restored", {
                                   description: "No alternative hospitals available; please select another manually."
                                });
                              }

                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
                          >
                            Retry →
                          </button>
                        )}
                      </div>
                    </div>
                   )
                })
              )}
            </div>
          </motion.div>

        </div>
      </div>
      
    </div>
  );
}
