import React, { useState, useEffect, useCallback } from "react";
import { db, auth } from "../src/firebaseConfig";
import { collection, getDocs, doc, setDoc, addDoc } from "firebase/firestore";

import RoutineTab from "../components/assistant/RoutineTab";

export default function Assistant() {
  const [config, setConfig] = useState(null);
  const [progress, setProgress] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Essas coleções provavelmente terão apenas um documento cada
      const configCollectionRef = collection(db, "assistant_configs");
      const progressCollectionRef = collection(db, "assistant_progress");

      const [configSnapshot, progressSnapshot] = await Promise.all([
        getDocs(configCollectionRef),
        getDocs(progressCollectionRef)
      ]);
      
      // Pega o primeiro documento de cada coleção, ou null se estiver vazio
      const configData = configSnapshot.docs.length > 0 
        ? { ...configSnapshot.docs[0].data(), id: configSnapshot.docs[0].id }
        : null;
        
      const progressData = progressSnapshot.docs.length > 0 
        ? { ...progressSnapshot.docs[0].data(), id: progressSnapshot.docs[0].id }
        : null;

      setConfig(configData);
      setProgress(progressData);
      setUser(auth.currentUser);

    } catch (error) {
      console.error("Erro ao carregar dados do Assistant:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  // As funções de salvar e atualizar estarão dentro do RoutineTab
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Rotina & Metas
          </h1>
          <p className="text-slate-400">Dashboard de produtividade e CRM avançado</p>
        </div>

        <RoutineTab 
          config={config}
          progress={progress}
          user={user}
          loading={loading}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}