"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Siren,
  BedDouble,
  Stethoscope,
  Ambulance,
  Users,
  PackageOpen,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Activity,
  ChevronRight,
  Network,
  ArrowRightLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",             href: "/hospital/dashboard",                          icon: LayoutDashboard },
  { label: "Incoming Emergencies",  href: "/hospital/dashboard/incoming-emergencies",     icon: Siren },
  { label: "Bed Management",        href: "/hospital/dashboard/bed-management",           icon: BedDouble },
  { label: "Doctor Availability",   href: "/hospital/dashboard/doctor-availability",      icon: Stethoscope },
  { label: "Ambulance Tracking",    href: "/hospital/dashboard/ambulance-tracking",       icon: Ambulance },
  { label: "Patient Queue",         href: "/hospital/dashboard/patient-queue",            icon: Users },
  { label: "Resource Management",   href: "/hospital/dashboard/resource-management",      icon: PackageOpen },
  { label: "Hospital Connect",      href: "/hospital/dashboard/connect",                  icon: Network },
  { label: "Patient Transfer",      href: "/hospital/dashboard/patient-transfer",         icon: ArrowRightLeft },
  { label: "Reports & Analytics",   href: "/hospital/dashboard/reports-analytics",        icon: BarChart3 },
  { label: "Notifications",         href: "/hospital/dashboard/notifications",            icon: Bell },
  { label: "Settings",              href: "/hospital/dashboard/settings",                 icon: Settings },
];

export default function HospitalSidebar() {
  const pathname = usePathname();
  const { userData, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40"
      style={{ background: "linear-gradient(180deg,#0f172a 0%,#111827 100%)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
          <Activity size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">HospiConnect</p>
          <p className="text-xs" style={{ color: "#64748b" }}>Hospital Portal</p>
        </div>
      </div>

      {/* Hospital name */}
      <div className="mx-4 mt-4 mb-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Logged in as</p>
        <p className="text-sm font-bold text-white truncate">{userData?.hospitalName || userData?.name || "Hospital Admin"}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/hospital/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer relative group"
                style={{
                  background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
                  color: isActive ? "#60a5fa" : "#94a3b8",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                    style={{ background: "#3b82f6" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={17} className={isActive ? "" : "group-hover:text-blue-400 transition-colors"} />
                <span className={`text-sm font-medium flex-1 ${isActive ? "text-blue-400" : "group-hover:text-slate-200 transition-colors"}`}>
                  {label}
                </span>
                {isActive && <ChevronRight size={14} className="text-blue-400 opacity-60" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all group"
          style={{ color: "#94a3b8" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <LogOut size={17} className="group-hover:text-red-400 transition-colors" />
          <span className="text-sm font-medium group-hover:text-red-400 transition-colors">Logout</span>
        </button>
      </div>
    </aside>
  );
}