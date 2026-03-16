"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

// Suppress the global Navbar on hospital dashboard routes
// (those routes have their own sidebar navigation)
export default function ConditionalNavbar() {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard")) return null;
  return <Navbar />;
}