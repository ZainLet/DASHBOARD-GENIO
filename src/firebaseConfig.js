// Importe as funções necessárias dos SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// A configuração do seu web app do Firebase
// É ALTAMENTE RECOMENDADO usar variáveis de ambiente para estas chaves
const firebaseConfig = {
  apiKey: "AIzaSyAk8c5nd38WJAyOLDeQ_hqJvwzTMqA8TBw",
  authDomain: "dash-genio.firebaseapp.com",
  projectId: "dash-genio",
  storageBucket: "dash-genio.appspot.com", // Corrigido para .appspot.com
  messagingSenderId: "853859948210",
  appId: "1:853859948210:web:7d2c89e7540a27792c1bab"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Exporte as instâncias dos serviços que você usará no aplicativo
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;