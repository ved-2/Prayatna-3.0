"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, getDocs, getDoc, addDoc, updateDoc, doc, serverTimestamp, increment } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Handshake, ShieldAlert, Package, Info, Loader2, Hospital, Network } from "lucide-react";

// The same resources from Resource Management
const RESOURCES = [
  { key: "oxygen", label: "Oxygen Cylinders", icon: "🫁", color: "#3b82f6" },
  { key: "ventilators", label: "Ventilators", icon: "🫀", color: "#8b5cf6" },
  { key: "blood", label: "Blood Bags", icon: "🩸", color: "#ef4444" },
  { key: "wheelchairs", label: "Wheelchairs", icon: "♿", color: "#10b981" },
];

export default function HospitalConnectPage() {
  const { user, userData } = useAuth();
  
  // State for the Send Request form
  const [selectedResource, setSelectedResource] = useState(RESOURCES[0].key);
  const [quantity, setQuantity] = useState(5);
  const [targetHospitalId, setTargetHospitalId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Data fetching state
  const [otherHospitals, setOtherHospitals] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    if (!user) return;

    // 1. Fetch other hospitals (for the dropdown and mapping names)
    const fetchHospitals = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "hospitals"));
        const hospitalsData = [];
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id !== user.uid) { // Exclude self
            hospitalsData.push({ id: docSnap.id, ...docSnap.data() });
          }
        });
        setOtherHospitals(hospitalsData);
        if (hospitalsData.length > 0) {
          setTargetHospitalId(hospitalsData[0].id);
        }
      } catch (error) {
        console.error("Error fetching hospitals:", error);
      }
    };
    fetchHospitals();

    // 2. Listen for Incoming Requests (Pending)
    const incomingQ = query(
      collection(db, "transferRequests"),
      where("toHospital", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsubIncoming = onSnapshot(incomingQ, (snap) => {
      setIncomingRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Listen for Outgoing Requests (All statuses to track)
    const outgoingQ = query(
      collection(db, "transferRequests"),
      where("fromHospital", "==", user.uid)
    );
    const unsubOutgoing = onSnapshot(outgoingQ, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by latest first locally since we might not have an index for createdAt desc
      docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setOutgoingRequests(docs);
      setLoading(false);
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, [user]);

  // 📝 Send a new transfer request
  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!user || !targetHospitalId || quantity <= 0) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, "transferRequests"), {
        resourceType: selectedResource,
        quantity: parseInt(quantity, 10),
        fromHospital: user.uid,
        toHospital: targetHospitalId,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setRequestSuccess(true);
      setTimeout(() => setRequestSuccess(false), 3000);
      setQuantity(5); // Reset
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request. Check console for details (Could be missing Firestore index/rules).");
    } finally {
      setIsSending(false);
    }
  };

  // ✅ Accept an incoming request
  const handleAcceptRequest = async (request) => {
    try {
      const fromRef = doc(db, "hospitals", request.fromHospital);
      const toRef = doc(db, "hospitals", user.uid); // Us (Receiver of request, Sender of resources)

      // Get both hospital documents to modify their resource arrays
      const fromSnap = await getDoc(fromRef);
      const toSnap = await getDoc(toRef);
      
      if (!fromSnap.exists() || !toSnap.exists()) throw new Error("Hospital document not found.");

      const fromData = fromSnap.data().resourceLayout || {};
      const toData = toSnap.data().resourceLayout || {};

      console.log("FROM DATA (Requester):", fromData);
      console.log("TO DATA (Us):", toData);

      // 1. DEDUCT from US (toDoc). We find N inactive (free) resources and remove them from our inventory.
      const ourResources = [...(toData[request.resourceType] || [])];
      let deducted = 0;
      for (let i = ourResources.length - 1; i >= 0; i--) {
        if (!ourResources[i].active && deducted < request.quantity) {
          ourResources.splice(i, 1);
          deducted++;
        }
      }

      console.log("OUR RESOURCES AFTER DEDUCTION:", ourResources);

      if (deducted < request.quantity) {
         alert(`You do not have enough free ${request.resourceType} to fulfill this request! (Have ${deducted}, Need ${request.quantity})`);
         return;
      }

      // 2. ADD to THEM (fromDoc). They are the requester. We add new free resources to their inventory.
      const theirResources = [...(fromData[request.resourceType] || [])];
      let maxId = theirResources.reduce((max, r) => Math.max(max, r.id), 0);
      
      for(let i = 0; i < request.quantity; i++) {
         theirResources.push({
            id: ++maxId,
            active: false
         });
      }

      // 3. Perform the updates
      console.log("UPDATING TO DOC WITH:", ourResources);
      await updateDoc(toRef, {
        [`resourceLayout.${request.resourceType}`]: ourResources
      });

      console.log("UPDATING FROM DOC WITH:", theirResources);
      await updateDoc(fromRef, {
        [`resourceLayout.${request.resourceType}`]: theirResources
      });

      // 4. Update the request status
      console.log("UPDATING REQUEST STATUS TO ACCEPTED");
      await updateDoc(doc(db, "transferRequests", request.id), {
        status: "accepted"
      });

      alert(`Successfully transferred ${request.quantity} ${request.resourceType}!`);

    } catch (error) {
      console.error("Error accepting request:", error);
      alert(`Error accepting: ${error.message}`);
    }
  };

  // ❌ Reject an incoming request
  const handleRejectRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, "transferRequests", requestId), {
        status: "rejected"
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const getHospitalName = (uid) => {
    const hosp = otherHospitals.find(h => h.id === uid);
    return hosp ? hosp.name || hosp.hospitalName || "Unknown Hospital" : "Unknown Hospital";
  };

  const getResourceDetails = (key) => {
    return RESOURCES.find(r => r.key === key) || { label: key, icon: "📦", color: "#64748b" };
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
          <Network className="text-blue-500" size={32} />
          Hospital Connect Network
        </h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Real-time resource transfer and coordination between regional hospitals.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left Column: Send Request & Outgoing Status ── */}
        <div className="space-y-8">
          
          {/* Send Request Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Send size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Request Resources</h2>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-5">
              
              {/* Resource Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Resource Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {RESOURCES.map(r => (
                    <div
                      key={r.key}
                      onClick={() => setSelectedResource(r.key)}
                      className={`cursor-pointer border-2 rounded-xl p-3 flex items-center gap-3 transition-all ${
                        selectedResource === r.key 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xl">{r.icon}</span>
                      <span className={`text-sm font-semibold ${selectedResource === r.key ? 'text-blue-700' : 'text-slate-600'}`}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity Needed</label>
                <input
                  type="number" min="1" required
                  value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-semibold transition-all"
                />
              </div>

              {/* Target Hospital */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Target Hospital</label>
                {otherHospitals.length === 0 ? (
                 <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <Info size={16}/> No other hospitals found in the network.
                 </div>
                ) : (
                  <select
                    value={targetHospitalId}
                    onChange={(e) => setTargetHospitalId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none font-semibold cursor-pointer"
                  >
                    {otherHospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name || h.hospitalName || "Unknown Hospital"} (ID: {h.id.slice(0,4)}...)</option>
                    ))}
                  </select>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                disabled={isSending || otherHospitals.length === 0}
                type="submit"
                className={`w-full py-4 rounded-xl text-white font-bold flex justify-center items-center gap-2 transition-all ${requestSuccess ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30'} disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : requestSuccess ? <Handshake size={20} /> : <Send size={18} />}
                {isSending ? "Transmitting..." : requestSuccess ? "Request Sent Successfully!" : "Broadcast Request to Target"}
              </motion.button>
            </form>
          </motion.div>

        </div>

        {/* ── Right Column: Incoming & Active Tracking ── */}
        <div className="space-y-8">

          {/* Incoming Requests Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-slate-900 rounded-3xl p-7 shadow-xl shadow-slate-900/10 border border-slate-800 text-white relative overflow-hidden"
          >
            {/* Background design elements */}
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <ShieldAlert size={120} />
            </div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-xl font-bold tracking-tight">Incoming SOS Requests</h2>
              <span className="ml-auto bg-rose-500/20 text-rose-400 py-1 px-3 text-xs font-bold rounded-full border border-rose-500/30">
                {incomingRequests.length} Pending
              </span>
            </div>

            <div className="space-y-4 relative z-10">
              {incomingRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-400/80 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
                  <Package className="mx-auto mb-3 opacity-30" size={32} />
                  <p className="text-sm font-medium">No pending requests from other hospitals.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {incomingRequests.map(req => {
                    const resDetails = getResourceDetails(req.resourceType);
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        key={req.id}
                        className="bg-slate-800 border border-slate-700 p-5 rounded-2xl"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs text-slate-400 font-semibold mb-1 tracking-wider uppercase">From Hospital</p>
                            <p className="font-bold text-amber-400 flex items-center gap-2">
                              <Hospital size={16}/> {getHospitalName(req.fromHospital)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400 font-semibold mb-1 tracking-wider uppercase">Needs</p>
                            <div className="flex items-center gap-2 text-lg font-black" style={{ color: resDetails.color }}>
                              {resDetails.icon} {req.quantity} <span className="text-sm">{resDetails.label}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button onClick={() => handleAcceptRequest(req)} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2.5 rounded-xl transition-colors text-sm">
                            Accept Transfer
                          </button>
                          <button onClick={() => handleRejectRequest(req.id)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
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

          {/* Outgoing Requests History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-6">Your Previous Requests</h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {outgoingRequests.length === 0 ? (
                <p className="text-sm text-slate-500 italic text-center py-4">You have not sent any requests yet.</p>
              ) : (
                outgoingRequests.map(req => {
                   const resDetails = getResourceDetails(req.resourceType);
                   const statusColors = {
                     pending: "bg-amber-100 text-amber-700 border-amber-200",
                     accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
                     rejected: "bg-rose-100 text-rose-700 border-rose-200"
                   };
                   
                   return (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{resDetails.icon}</div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Requested {req.quantity} {resDetails.label}</p>
                          <p className="text-xs text-slate-500 font-medium tracking-wide">To: {getHospitalName(req.toHospital)}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[req.status] || statusColors.pending}`}>
                        {req.status}
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
