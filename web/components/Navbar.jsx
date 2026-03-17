"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  LogOut,
  Menu,
  Bell,
  Settings,
  ChevronDown,
  ActivitySquare,
  LayoutDashboard,
  ClipboardList,
  Stethoscope,
} from "lucide-react";
import {
  Activity,
  LogOut,
  Menu,
  Bell,
  Settings,
  ChevronDown,
  ActivitySquare,
  LayoutDashboard,
  ClipboardList,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const { user, userData, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();


  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname.includes("/login") || pathname.includes("/register")) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    router.push("/");
  };

  const isActive = (path) =>
    pathname === path || (path !== "/" && pathname.startsWith(path));
  const isActive = (path) =>
    pathname === path || (path !== "/" && pathname.startsWith(path));

  // --- 1. Guest Links ---
  // --- 1. Guest Links ---
  const renderGuestLinks = () => (
    <>
      <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-600">
        <Link
          href="/#network"
          className="hover:text-blue-600 transition-colors"
        >
          Network
        </Link>
        <Link
          href="/#protocol"
          className="hover:text-blue-600 transition-colors"
        >
          Emergency Protocol
        </Link>
        <Link href="/#about" className="hover:text-blue-600 transition-colors">
          About Us
        </Link>
      <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-600">
        <Link
          href="/#network"
          className="hover:text-blue-600 transition-colors"
        >
          Network
        </Link>
        <Link
          href="/#protocol"
          className="hover:text-blue-600 transition-colors"
        >
          Emergency Protocol
        </Link>
        <Link href="/#about" className="hover:text-blue-600 transition-colors">
          About Us
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-blue-700 transition shadow-md shadow-blue-100"
        >
        <Link
          href="/login"
          className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-blue-700 transition shadow-md shadow-blue-100"
        >
          Join Network
        </Link>
      </div>
    </>
  );

  // --- 2. Citizen Links ---
  // --- 2. Citizen Links ---
  const renderCitizenLinks = () => (
    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
      {/* <Link
        href="/citizen"
        className={`transition-all relative py-2 ${isActive("/citizen") && pathname === "/citizen" ? "text-blue-600" : "hover:text-slate-900"}`}
      >
        Find Care
        {isActive("/citizen") && pathname === "/citizen" && (
          <motion.div
            layoutId="nav-pill"
            className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-blue-600"
          />
        )}
      </Link> */}
      <Link
        href="/citizen/history"
        className={`transition-all relative py-2 ${pathname.includes("history") ? "text-blue-600" : "hover:text-slate-900"}`}
      >
        My Requests
        {pathname.includes("history") && (
          <motion.div
            layoutId="nav-pill"
            className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-blue-600"
          />
        )}
      </Link>
    </div>
    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
      {/* <Link
        href="/citizen"
        className={`transition-all relative py-2 ${isActive("/citizen") && pathname === "/citizen" ? "text-blue-600" : "hover:text-slate-900"}`}
      >
        Find Care
        {isActive("/citizen") && pathname === "/citizen" && (
          <motion.div
            layoutId="nav-pill"
            className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-blue-600"
          />
        )}
      </Link> */}
      <Link
        href="/citizen/history"
        className={`transition-all relative py-2 ${pathname.includes("history") ? "text-blue-600" : "hover:text-slate-900"}`}
      >
        My Requests
        {pathname.includes("history") && (
          <motion.div
            layoutId="nav-pill"
            className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-blue-600"
          />
        )}
      </Link>
    </div>
  );

  // --- 3. Hospital Links ---
  // --- 3. Hospital Links ---
  const renderHospitalLinks = () => (
    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
      <Link
        href="/hospital"
        className={`transition-all relative py-2 ${isActive("/hospital") && pathname === "/hospital" ? "text-blue-600" : "hover:text-slate-900"}`}
      >
        Operations Hub
        {isActive("/hospital") && pathname === "/hospital" && (
          <motion.div
            layoutId="nav-pill"
            className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-blue-600"
          />
        )}
      </Link>
      <Link
        href="/hospital/inventory"
        className={`transition-all relative py-2 ${pathname.includes("inventory") ? "text-blue-600" : "hover:text-slate-900"}`}
      >
        Live Bed Count
        {pathname.includes("inventory") && (
          <motion.div
            layoutId="nav-pill"
            className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-blue-600"
          />
        )}
      </Link>
    </div>
  );

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-[72px] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm group-hover:bg-blue-700 transition-colors">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm group-hover:bg-blue-700 transition-colors">
              <Activity className="text-white w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              Hospi<span className="text-blue-600">Connect</span>
            </span>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              Hospi<span className="text-blue-600">Connect</span>
            </span>
          </Link>

          {/* Navigation */}
          {!loading && mounted ? (
          {/* Navigation */}
          {!loading && mounted ? (
            <div className="flex items-center gap-6">
              {!user && renderGuestLinks()}
              {user && userData?.role === "citizen" && renderCitizenLinks()}
              {user &&
                userData?.role === "hospital_admin" &&
                renderHospitalLinks()}
              {user &&
                userData?.role === "hospital_admin" &&
                renderHospitalLinks()}

              {user && (
                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                    <Bell size={20} />
                  </button>

                  <div className="relative" ref={dropdownRef}>
                    <button
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 p-1 pl-1 pr-2 hover:bg-slate-50 border border-slate-100 rounded-full transition-all"
                      className="flex items-center gap-2 p-1 pl-1 pr-2 hover:bg-slate-50 border border-slate-100 rounded-full transition-all"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${userData?.role === "hospital_admin" ? "bg-amber-500" : "bg-blue-600"}`}
                      >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${userData?.role === "hospital_admin" ? "bg-amber-500" : "bg-blue-600"}`}
                      >
                        {(userData?.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                      />
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50"
                        >
                          <div className="px-4 py-3 border-b border-slate-50">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                              {userData?.role === "hospital_admin"
                                ? "Hospital Staff"
                                : "Citizen"}
                            </p>
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {userData?.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {userData?.email}
                            </p>
                          <div className="px-4 py-3 border-b border-slate-50">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                              {userData?.role === "hospital_admin"
                                ? "Hospital Staff"
                                : "Citizen"}
                            </p>
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {userData?.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {userData?.email}
                            </p>
                          </div>

                          <div className="p-1">
                            <Link
                              href={
                                userData?.role === "hospital_admin"
                                  ? "/hospital"
                                  : "/citizen"
                              }
                              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition"
                            >
                              <LayoutDashboard size={16} /> Dashboard
                            </Link>
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition text-left">
                              <Settings size={16} /> Settings

                          <div className="p-1">
                            <Link
                              href={
                                userData?.role === "hospital_admin"
                                  ? "/hospital"
                                  : "/citizen"
                              }
                              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition"
                            >
                              <LayoutDashboard size={16} /> Dashboard
                            </Link>
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition text-left">
                              <Settings size={16} /> Settings
                            </button>
                          </div>

                          <div className="border-t border-slate-50 p-1 mt-1">

                          <div className="border-t border-slate-50 p-1 mt-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition text-left"
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition text-left"
                            >
                              <LogOut size={16} /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              <button
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"

              <button
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu size={24} />
              </button>
            </div>
          ) : (
            <div className="h-8 w-24 bg-slate-50 animate-pulse rounded-full" />
            <div className="h-8 w-24 bg-slate-50 animate-pulse rounded-full" />
          )}
        </div>

        {/* Mobile Menu */}
        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 shadow-inner px-4 py-6"
              className="md:hidden bg-white border-t border-slate-100 shadow-inner px-4 py-6"
            >
              <div className="flex flex-col gap-2">
                {/* Mobile links here follow the same light pattern */}
                {!user ? (
              <div className="flex flex-col gap-2">
                {/* Mobile links here follow the same light pattern */}
                {!user ? (
                  <>
                    <Link
                      href="/login"
                      className="p-3 font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="p-3 font-bold bg-blue-600 text-white rounded-xl text-center shadow-lg shadow-blue-100"
                    >
                      Join Network
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="p-3 font-bold text-red-500 bg-red-50 rounded-xl text-left transition"
                  >
                    Sign Out
                  </button>
                    <Link
                      href="/login"
                      className="p-3 font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="p-3 font-bold bg-blue-600 text-white rounded-xl text-center shadow-lg shadow-blue-100"
                    >
                      Join Network
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="p-3 font-bold text-red-500 bg-red-50 rounded-xl text-left transition"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <div className="h-[72px]" />
      <div className="h-[72px]" />
    </>
  );
}

