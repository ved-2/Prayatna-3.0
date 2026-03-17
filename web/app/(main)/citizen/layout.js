"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Home, FileText, User, Activity, LogOut } from "lucide-react";

export default function CitizenLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login"); // Auth Guard
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-500">Securing connection...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/citizen" },
    { icon: Activity, label: "Emergency Resources", href: "/citizen/resources" },
    { icon: FileText, label: "History", href: "/citizen/history" },
    { icon: User, label: "Profile", href: "/citizen/profile" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Web Navigation Bar */}
      <nav className="bg-[#1a2332] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                 <Activity size={20} className="text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight hidden sm:block">HospiConnect <span className="text-blue-400 font-normal">Citizen</span></span>
            </div>

            {/* Desktop Center Links */}
            <div className="hidden md:flex space-x-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.label} 
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? "bg-white/10 text-white border border-white/5" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-blue-400" : ""} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Tools Profile / Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                 <p className="text-sm font-bold leading-tight">{user.displayName || user.email?.split('@')[0] || "Citizen"}</p>
                 <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Secured Network</span>
              </div>
              <button 
                onClick={logout}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition border border-slate-700"
                title="Logout"
              >
                <LogOut size={18} className="text-slate-300 hover:text-white" />
              </button>
            </div>

          </div>
        </div>
        
        {/* Mobile Scroller Nav (Shown only on small screens) */}
        <div className="md:hidden border-t border-slate-800 bg-[#121927] overflow-x-auto whitespace-nowrap hide-scrollbar flex justify-start items-center p-2 gap-2">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.label} 
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                      isActive 
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                        : "text-slate-400 bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </Link>
                );
              })}
        </div>
      </nav>

      {/* Main Page Content */}
      <main className="flex-1 w-full relative">
        {children}
      </main>

    </div>
  );
}
