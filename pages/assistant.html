import React, { useState, useEffect } from "react";
import { FarmProfile, FarmAd, FarmComment } from "@/entities/all";
import { User } from "@/entities/User";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Target, History, Play } from "lucide-react";

import ProfilesTab from "../components/farm/ProfilesTab";
import AdsTab from "../components/farm/AdsTab";
import HistoryTab from "../components/farm/HistoryTab";
import WorkspaceTab from "../components/farm/WorkspaceTab";

export default function Farm() {
  const [profiles, setProfiles] = useState([]);
  const [ads, setAds] = useState([]);
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profilesData, adsData, commentsData, userData] = await Promise.all([
        FarmProfile.list('-created_date'),
        FarmAd.list('-created_date'),
        FarmComment.list('-created_date'),
        User.me()
      ]);
      setProfiles(profilesData);
      setAds(adsData);
      setComments(commentsData);
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
            Farm de Perfis
          </h1>
          <p className="text-slate-400">Gerencie perfis e automatize comentários</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700">
            <TabsTrigger 
              value="profiles" 
              className="flex items-center gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
            >
              <Bot className="w-4 h-4" />
              Perfis
            </TabsTrigger>
            <TabsTrigger 
              value="ads" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
            >
              <Target className="w-4 h-4" />
              Anúncios
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
            >
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger 
              value="workspace" 
              className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400"
            >
              <Play className="w-4 h-4" />
              Área de Trabalho
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="mt-6">
            <ProfilesTab 
              profiles={profiles} 
              loading={loading} 
              onRefresh={handleRefresh}
              user={user}
            />
          </TabsContent>

          <TabsContent value="ads" className="mt-6">
            <AdsTab 
              ads={ads} 
              loading={loading} 
              onRefresh={handleRefresh}
              comments={comments}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <HistoryTab 
              comments={comments} 
              profiles={profiles}
              ads={ads}
              loading={loading} 
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="workspace" className="mt-6">
            <WorkspaceTab 
              profiles={profiles}
              ads={ads}
              comments={comments}
              onRefresh={handleRefresh}
              user={user}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}