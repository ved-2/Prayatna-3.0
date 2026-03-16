"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Siren, AlertTriangle, Ambulance, CheckCheck } from "lucide-react";

const TYPE_CONFIG = {
  emergency:    { icon: Siren,          color: "#ef4444", bg: "#fef2f2" },
  warning:      { icon: AlertTriangle,  color: "#f59e0b", bg: "#fffbeb" },
  ambulance:    { icon: Ambulance,      color: "#3b82f6", bg: "#eff6ff" },
  info:         { icon: Bell,           color: "#6366f1", bg: "#f5f3ff" },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("hospitalId", "==", user.uid)
      // No orderBy here — avoids composite index requirement.
      // We sort client-side below.
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort newest-first client-side
      data.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setNotifications(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const markRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true, readAt: serverTimestamp() });
  };

  const markAllRead = async () => {
    notifications.filter(n => !n.read).forEach(n => markRead(n.id));
  };

  const formatTime = ts => {
    if (!ts || !now) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = (now - d.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>🔔 Notifications</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "#eff6ff", color: "#3b82f6" }}>
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 rounded-2xl"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
          <Bell size={48} style={{ color: "#cbd5e1" }} className="mb-3" />
          <p className="text-lg font-bold" style={{ color: "#0f172a" }}>No notifications</p>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Real-time alerts will appear here as they arrive.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <motion.div key={n.id}
                  initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }} transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-4 rounded-2xl px-5 py-4 transition-all"
                  style={{
                    background: n.read ? "#fff" : cfg.bg,
                    border: `1px solid ${n.read ? "#e2e8f0" : cfg.color + "30"}`,
                    boxShadow: n.read ? "0 1px 4px rgba(0,0,0,0.04)" : `0 2px 12px ${cfg.color}15`,
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}15` }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{n.message}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{formatTime(n.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!n.read && (
                      <>
                        <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                        <button onClick={() => markRead(n.id)}
                          className="text-xs font-semibold px-3 py-1 rounded-lg transition-all hover:scale-105"
                          style={{ background: `${cfg.color}15`, color: cfg.color }}>
                          Dismiss
                        </button>
                      </>
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