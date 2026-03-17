/**
 * HospiConnect – Firestore Seed Utility
 * 
 * Usage (browser console or a one-time script):
 * Replace YOUR_HOSPITAL_UID with the Firebase Auth UID of your hospital admin user.
 * 
 * Run via: node scripts/seedFirestore.js  (requires firebase-admin or run in browser)
 * 
 * This script seeds sample data for demo purposes.
 * The Settings page also auto-creates the hospitals/{uid} document on first visit.
 */

// ── Browser-usable seed (copy-paste into browser console while logged in) ─────
// Import firebase from the app's firebase.js and call seedHospital(auth.currentUser.uid)

import { db } from "@/lib/firebase";
import {
  doc, setDoc, addDoc, collection, serverTimestamp, Timestamp,
} from "firebase/firestore";

export async function seedHospital(uid) {
  console.log("🌱 Seeding hospital data for uid:", uid);

  // 1. Hospital profile, beds, resources
  await setDoc(doc(db, "hospitals", uid), {
    name: "City General Hospital",
    address: "123 Medical Avenue, Healthcare City",
    phone: "+91 98765 43210",
    email: "admin@citygeneral.com",
    doctorsOnDuty: 5,
    beds: {
      icu:       { total: 10, available: 3 },
      general:   { total: 50, available: 18 },
      emergency: { total: 15, available: 6 },
    },
    resources: {
      oxygen: 42, ventilators: 9, emergencyKits: 24,
      icuEquipment: 6, bloodBags: 35, wheelchairs: 15,
    },
    createdAt: serverTimestamp(),
  }, { merge: true });

  // 2. Doctors subcollection
  const doctors = [
    { name: "Dr. Priya Sharma",   specialization: "Cardiologist",   status: "available" },
    { name: "Dr. Rahul Patel",    specialization: "Orthopedic",      status: "busy"      },
    { name: "Dr. Anita Singh",    specialization: "Neurologist",     status: "available" },
    { name: "Dr. Vikram Mehta",   specialization: "General Surgeon", status: "off"       },
    { name: "Dr. Deepa Nair",     specialization: "Pediatrician",    status: "available" },
  ];
  for (const dr of doctors) {
    const ref = doc(collection(db, "hospitals", uid, "doctors"));
    await setDoc(ref, { ...dr, createdAt: serverTimestamp() }, { merge: true });
  }

  // 3. Emergencies
  const emergencies = [
    { patientName: "Ravi Kumar",  patientId: "PAT001", symptoms: "Chest pain, breathlessness", eta: 5,  priority: "critical", status: "incoming",  ambulanceId: "AMB-01", hospitalId: uid, location: "MG Road", createdAt: serverTimestamp() },
    { patientName: "Meena Devi",  patientId: "PAT002", symptoms: "Head injury from accident",  eta: 12, priority: "high",     status: "accepted",  ambulanceId: "AMB-02", hospitalId: uid, location: "Ring Road", createdAt: serverTimestamp() },
    { patientName: "Sunita Rao",  patientId: "PAT003", symptoms: "High fever, seizures",        eta: 8,  priority: "high",     status: "preparing", ambulanceId: "AMB-03", hospitalId: uid, location: "Bus Stand", createdAt: serverTimestamp() },
    { patientName: "Arjun Das",   patientId: "PAT004", symptoms: "Fractured leg",               eta: 20, priority: "medium",  status: "completed", ambulanceId: "AMB-04", hospitalId: uid, location: "Market", createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000)) },
  ];
  for (const em of emergencies) {
    const ref = doc(collection(db, "emergencies"));
    await setDoc(ref, em, { merge: true });
  }

  // 4. Ambulances
  const ambulances = [
    { ambulanceId: "AMB-01", driverName: "Suresh Kumar",  patientOnboard: true,  patientName: "Ravi Kumar", eta: 5,  location: "MG Road Junction",   gpsLat: 12.9716, gpsLng: 77.5946, hospitalId: uid },
    { ambulanceId: "AMB-02", driverName: "Mohan Lal",     patientOnboard: true,  patientName: "Meena Devi",  eta: 12, location: "Ring Road near Flyover", gpsLat: 12.9800, gpsLng: 77.6100, hospitalId: uid },
    { ambulanceId: "AMB-03", driverName: "Rajesh Gupta",  patientOnboard: false, patientName: null,          eta: null, location: "Hospital Bay",       gpsLat: 12.9716, gpsLng: 77.5946, hospitalId: uid },
  ];
  for (const amb of ambulances) {
    const ref = doc(collection(db, "ambulances"));
    await setDoc(ref, amb, { merge: true });
  }

  // 5. Patient Queue
  const queue = [
    { name: "Ravi Kumar",   symptoms: "Chest pain",     assignedDoctor: "Dr. Priya Sharma",  priority: "critical", arrivalTime: serverTimestamp(), hospitalId: uid },
    { name: "Meena Devi",   symptoms: "Head injury",    assignedDoctor: "Dr. Vikram Mehta",  priority: "high",     arrivalTime: serverTimestamp(), hospitalId: uid },
    { name: "Sunita Rao",   symptoms: "Seizures",       assignedDoctor: "Dr. Anita Singh",   priority: "high",     arrivalTime: serverTimestamp(), hospitalId: uid },
    { name: "Pradeep Nair", symptoms: "Back pain",      assignedDoctor: "Unassigned",         priority: "low",      arrivalTime: serverTimestamp(), hospitalId: uid },
    { name: "Kavitha R",    symptoms: "Stomach ache",   assignedDoctor: "Dr. Deepa Nair",    priority: "medium",   arrivalTime: serverTimestamp(), hospitalId: uid },
  ];
  for (const p of queue) {
    const ref = doc(collection(db, "patientQueue"));
    await setDoc(ref, p, { merge: true });
  }

  // 6. Notifications
  const notifs = [
    { message: "🚨 Incoming patient RAVI KUMAR – ETA 5 min (Critical: Chest Pain)", type: "emergency", read: false, hospitalId: uid, createdAt: serverTimestamp() },
    { message: "⚠ ICU beds critically low — only 3 available out of 10",             type: "warning",   read: false, hospitalId: uid, createdAt: serverTimestamp() },
    { message: "🚑 Ambulance AMB-02 en route – ETA 12 minutes",                       type: "ambulance", read: false, hospitalId: uid, createdAt: serverTimestamp() },
    { message: "ℹ Dr. Vikram Mehta has gone off-duty",                               type: "info",      read: true,  hospitalId: uid, createdAt: Timestamp.fromDate(new Date(Date.now() - 7200000)) },
  ];
  for (const n of notifs) {
    const ref = doc(collection(db, "notifications"));
    await setDoc(ref, n, { merge: true });
  }

  // 7. Analytics
  await setDoc(doc(db, "analytics", uid), {
    emergenciesToday: 3,
    casesResolved: 1,
    avgResponseTime: 10,
    ambulancesToday: 3,
    bedUsage: { icu: 70, general: 64, emergency: 60 },
  }, { merge: true });

  console.log("✅ Seed complete!");
}