"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LogOut, Menu, UserCircle, Building2, Bell, Settings, ChevronDown, ActivitySquare } from "lucide-react";
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render completely on auth pages, except we could, but typical patterns exclude it
  if (pathname.includes("/login") || pathname.includes("/register")) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    router.push("/");
  };

  // Nav Item Stylings
  const isActive = (path) => pathname === path || (path !== '/' && pathname.startsWith(path));

  // --- 1. Without login ---
  const renderGuestLinks = () => (
    <>
      <div className="hidden md:flex gap-8 text-sm font-bold text-slate-500">
        <Link href="/#network" className="hover:text-slate-900 transition-colors">Network</Link>
        <Link href="/#protocol" className="hover:text-slate-900 transition-colors">Emergency Protocol</Link>
        <Link href="/#about" className="hover:text-slate-900 transition-colors">About Us</Link>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">Login</Link>
        <Link href="/register" className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-extrabold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
          Join Network
        </Link>
      </div>
    </>
  );

  // --- 2. Citizen Logged In ---
  const renderCitizenLinks = () => (
    <>
      <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
        <Link href="/citizen" className={`transition-all relative ${isActive('/citizen') && pathname === '/citizen' ? 'text-blue-600' : 'hover:text-slate-900'}`}>
          Find Care
          {isActive('/citizen') && pathname === '/citizen' && <motion.div layoutId="nav-pill" className="absolute -bottom-5 w-full h-1 bg-blue-600 rounded-t-full" />}
        </Link>
        <Link href="/citizen/history" className={`transition-all relative ${pathname.includes('history') ? 'text-blue-600' : 'hover:text-slate-900'}`}>
          My Requests
          {pathname.includes('history') && <motion.div layoutId="nav-pill" className="absolute -bottom-5 w-full h-1 bg-blue-600 rounded-t-full" />}
        </Link>
      </div>
    </>
  );

  // --- 3. Hospital Admin Logged In ---
  const renderHospitalLinks = () => (
    <>
      {/* <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
        <Link href="/hospital" className={`transition-all relative ${isActive('/hospital') && pathname === '/hospital' ? 'text-blue-600' : 'hover:text-slate-900'}`}>
          Operations Hub
          {isActive('/hospital') && pathname === '/hospital' && <motion.div layoutId="nav-pill" className="absolute -bottom-5 w-full h-1 bg-blue-600 rounded-t-full" />}
        </Link>
        <Link href="/hospital/inventory" className={`transition-all relative ${pathname.includes('inventory') ? 'text-blue-600' : 'hover:text-slate-900'}`}>
          Live Bed Count
          {pathname.includes('inventory') && <motion.div layoutId="nav-pill" className="absolute -bottom-5 w-full h-1 bg-blue-600 rounded-t-full" />}
        </Link>
      </div> */}
    </>
  );

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="w-full px-4 lg:px-8 h-[72px] flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              <Activity className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-2xl text-slate-900 tracking-tight">Hospi<span className="text-blue-600">Connect</span></span>
          </Link>

          {/* Dynamic Nav Items */}
          {(!loading && mounted) ? (
            <div className="flex items-center gap-6">
              {!user && renderGuestLinks()}
              {user && userData?.role === "citizen" && renderCitizenLinks()}
              {user && userData?.role === "hospital_admin" && renderHospitalLinks()}

              {/* Authed User Actions */}
              {user && (
                <div className="flex items-center gap-3 border-l border-slate-200 pl-6 ml-2">
                  <button className="hidden sm:flex relative p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  </button>

                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 p-1.5 pr-3 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-full transition-all group"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${userData?.role === 'hospital_admin' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                        {(userData?.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown size={14} className={`text-slate-400 group-hover:text-slate-600 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-3xl shadow-2xl py-3 z-50 origin-top-right"
                        >
                          <div className="px-5 py-3 border-b border-slate-100 mb-2">
                            <span className={`inline-block px-2 py-1 mb-2 rounded-md text-[9px] font-black uppercase tracking-widest ${userData?.role === 'hospital_admin' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                              {userData?.role === 'hospital_admin' ? 'Hospital Admin' : 'Citizen Account'}
                            </span>
                            <p className="text-sm font-extrabold text-slate-900 truncate">{userData?.name || "User"}</p>
                            <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">{userData?.email || "user@example.com"}</p>
                          </div>
                          
                          <div className="px-2 space-y-1">
                            {userData?.role === "hospital_admin" && (
                              <Link href="/hospital" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition">
                                <ActivitySquare size={16} className="text-slate-400" /> Admin Feed
                              </Link>
                            )}
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition text-left">
                              <Settings size={16} className="text-slate-400" /> Account Settings
                            </button>
                          </div>
                          
                          <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition text-left"
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
              
              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu size={24} />
              </button>
            </div>
          ) : (
             <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-full" />
          )}
        </div>

        {/* Mobile Nav Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col gap-1 p-4 font-bold text-slate-700">
                {!user && (
                  <>
                    <Link href="/#network" className="p-3 hover:bg-slate-50 rounded-xl" onClick={()=>setMobileMenuOpen(false)}>Network</Link>
                    <Link href="/login" className="p-3 hover:bg-slate-50 rounded-xl" onClick={()=>setMobileMenuOpen(false)}>Login</Link>
                    <Link href="/register" className="p-3 bg-blue-50 text-blue-700 rounded-xl mt-2 text-center" onClick={()=>setMobileMenuOpen(false)}>Join Network</Link>
                  </>
                )}
                {user && userData?.role === "citizen" && (
                  <>
                    <p className="px-3 text-[10px] uppercase tracking-widest text-slate-400 mb-2 mt-1">Citizen Menu</p>
                    <Link href="/citizen" className="p-3 hover:bg-slate-50 rounded-xl" onClick={()=>setMobileMenuOpen(false)}>Find Care</Link>
                    <Link href="/citizen/history" className="p-3 hover:bg-slate-50 rounded-xl" onClick={()=>setMobileMenuOpen(false)}>My Requests</Link>
                    <button onClick={handleLogout} className="text-left text-red-600 p-3 mt-2 font-bold hover:bg-red-50 rounded-xl">Sign Out</button>
                  </>
                )}
                {user && userData?.role === "hospital_admin" && (
                  <>
                    <p className="px-3 text-[10px] uppercase tracking-widest text-slate-400 mb-2 mt-1">Hospital Staff</p>
                    <Link href="/hospital" className="p-3 hover:bg-slate-50 rounded-xl" onClick={()=>setMobileMenuOpen(false)}>Operations Hub</Link>
                    <Link href="/hospital/inventory" className="p-3 hover:bg-slate-50 rounded-xl" onClick={()=>setMobileMenuOpen(false)}>Live Bed Count</Link>
                    <button onClick={handleLogout} className="text-left text-red-600 p-3 mt-2 font-bold hover:bg-red-50 rounded-xl">Sign Out</button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      {/* Spacer */}
      <div className="h-[72px] w-full" />
    </>
  );
}