import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

// VERY IMPORTANT: Requires your standard web firebase config to run as a node script
// Replace with your actual firebase config if different
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "prayatna-e9460.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prayatna-e9460",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "prayatna-e9460.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "228221870311",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:228221870311:web:4f63cdecee50a581413a94"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sleep helper
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function runSimulator() {
  console.log("🚑 Starting Ambulance Simulator...");
  
  // 1. Get all ambulances
  const querySnapshot = await getDocs(collection(db, "ambulances"));
  const allAmbulances = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  if (allAmbulances.length === 0) {
    console.error("❌ No ambulances found in Firestore. Please run seed script first.");
    process.exit(1);
  }

  // 2. We'll pick the first ambulance and move it
  const targetAmb = allAmbulances[0];
  console.log(`📡 Selected Ambulance: ${targetAmb.id} (Hospital: ${targetAmb.hospitalId})`);

  // Starting location in Delhi
  let lat = targetAmb.gpsLat || 28.6139;
  let lng = targetAmb.gpsLng || 77.2090;

  console.log(`Starting coordinates: ${lat}, ${lng}`);
  console.log("Press Ctrl+C to stop the simulator\n");

  let step = 0;
  
  // 3. Infinite loop updating location every 2.5 seconds
  while (true) {
    step++;
    
    // Slight random movement
    lat += (Math.random() - 0.4) * 0.001; // mostly moving north/east
    lng += (Math.random() - 0.4) * 0.001;
    
    try {
      await updateDoc(doc(db, "ambulances", targetAmb.id), {
        gpsLat: lat,
        gpsLng: lng,
        location: `Moving... (Step ${step})`
      });
      
      console.log(`[Update #${step}] 📍 New Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch (err) {
      console.error("❌ Error updating Firestore:", err.message);
    }
    
    await delay(2500); // 2.5 seconds between "GPS pings"
  }
}

runSimulator().catch(console.error);
