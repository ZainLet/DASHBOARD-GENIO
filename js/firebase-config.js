import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAk8c5nd38WJAyOLDeQ_hqJvwzTMqA8TBw",
    authDomain: "dash-genio.firebaseapp.com",
    projectId: "dash-genio",
    storageBucket: "dash-genio.appspot.com",
    messagingSenderId: "853859948210",
    appId: "1:853859948210:web:7d2c89e7540a27792c1bab"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); // Exporta o provedor do Google