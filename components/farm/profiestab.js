import React, { useState } from "react";
import { FarmProfile } from "@/entities/FarmProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Users, Activity, Shield, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import ProfileModal from "./ProfileModal";

const statusColors = {
  'ativo': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'pausado': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'banido': 'bg-red-500/20 text-red-400 border-red-500/30',
  'verificando': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

export default function ProfilesTab({ profiles, loading, onRefresh, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  const handleSaveProfile = async (profileData) => {
    try {
      if (editingProfile) {
        await FarmProfile.update(editingProfile.id, profileData);
      } else {
        await FarmProfile.create(profileData);
      }
      setShowModal(false);
      setEditingProfile(null);
      onRefresh();
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (window.confirm("Tem certeza que deseja excluir este perfil?")) {
      try {
        await FarmProfile.delete(profileId);
        onRefresh();
      } catch (error) {
        console.error("Erro ao excluir perfil:", error);
      }
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    Object.values(profile).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const stats = {
    total: profiles.length,
    ativos: profiles.filter(p => p.status === 'ativo').length,
    banidos: profiles.filter(p => p.status === 'banido').length,
    comentariosHoje: profiles.reduce((sum, p) => sum + (p.comentariosHoje || 0), 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 bg-slate-700 mb-2" />
                <Skeleton className="h-8 w-16 bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Ativos</CardTitle>
            <Activity className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{stats.ativos}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-xl border border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Banidos</CardTitle>
            <Shield className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.banidos}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 backdrop-blur-xl border border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Comentários Hoje</CardTitle>
            <Clock className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{stats.comentariosHoje}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar perfis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
            
            <Button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Username</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Seguidores</TableHead>
                  <TableHead className="text-slate-300">Comentários Hoje</TableHead>
                  <TableHead className="text-slate-300">Último Uso</TableHead>
                  <TableHead className="text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow 
                    key={profile.id} 
                    className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {profile.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-200">{profile.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{profile.email}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[profile.status] || statusColors.ativo}>
                        {profile.status || 'ativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {profile.seguidores ? profile.seguidores.toLocaleString('pt-BR') : '0'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {profile.comentariosHoje || 0} / {profile.limiteComentarios || 10}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {profile.ultimoUso ? 
                        new Date(profile.ultimoUso).toLocaleDateString('pt-BR') : 
                        'Nunca'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingProfile(profile);
                            setShowModal(true);
                          }}
                          className="hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="hover:bg-slate-700/50 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredProfiles.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum perfil encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <ProfileModal
          profile={editingProfile}
          onSave={handleSaveProfile}
          onClose={() => {
            setShowModal(false);
            setEditingProfile(null);
          }}
        />
      )}
    </div>
  );
}