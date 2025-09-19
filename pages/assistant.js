import React, { useState, useEffect } from "react";
import { AssistantConfig, AssistantProgress, AssistantLog } from "@/entities/all";
import { User } from "@/entities/User";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Users } from "lucide-react";

import RoutineTab from "../components/assistant/RoutineTab";

export default function Assistant() {
  const [config, setConfig] = useState(null);
  const [progress, setProgress] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configData, progressData, userData] = await Promise.all([
        AssistantConfig.list(),
        AssistantProgress.list(),
        User.me()
      ]);
      
      setConfig(configData[0] || null);
      setProgress(progressData[0] || null);
      setUser(userData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setLoading(false);
  };

  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Rotina & Metas
          </h1>
          <p className="text-slate-400">Dashboard de produtividade e CRM avançado</p>
        </div>

        {/* Content */}
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