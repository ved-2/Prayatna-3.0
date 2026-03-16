import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCbOecRNx3BxzfBfQrC_9GF0l6IYkD9sfs",
    authDomain: "hospiconnect-f206f.firebaseapp.com",
    projectId: "hospiconnect-f206f",
    storageBucket: "hospiconnect-f206f.firebasestorage.app",
    messagingSenderId: "503637092506",
    appId: "1:503637092506:web:42382ca07c9379c3701723",
    measurementId: "G-J91NPZVR7S"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();