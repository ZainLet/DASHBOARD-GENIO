import React, { useState, useEffect, useCallback } from "react";
import { db, auth } from "../src/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const profilesCollectionRef = collection(db, "farm_profiles");
      const adsCollectionRef = collection(db, "farm_ads");
      const commentsCollectionRef = collection(db, "farm_comments");

      const [profilesSnapshot, adsSnapshot, commentsSnapshot] = await Promise.all([
        getDocs(profilesCollectionRef),
        getDocs(adsCollectionRef),
        getDocs(commentsCollectionRef)
      ]);

      const profilesData = profilesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      const adsData = adsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      const commentsData = commentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      setProfiles(profilesData);
      setAds(adsData);
      setComments(commentsData);
      setUser(auth.currentUser);

    } catch (error) {
      console.error("Erro ao carregar dados do Farm:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
              onRefresh={loadData}
              user={user}
            />
          </TabsContent>

          <TabsContent value="ads" className="mt-6">
            <AdsTab
              ads={ads}
              loading={loading}
              onRefresh={loadData}
              comments={comments}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <HistoryTab
              comments={comments}
              profiles={profiles}
              ads={ads}
              loading={loading}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="workspace" className="mt-6">
            <WorkspaceTab
              profiles={profiles}
              ads={ads}
              comments={comments}
              onRefresh={loadData}
              user={user}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}