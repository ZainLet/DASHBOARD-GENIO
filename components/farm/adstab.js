import React, { useState } from "react";
import { FarmAd } from "@/entities/FarmAd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Edit, Trash2, Target, Play, Pause, BarChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import AdModal from "./AdModal";

const statusColors = {
  'ativo': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'pausado': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
};

export default function AdsTab({ ads, loading, onRefresh, comments }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");

  const handleSaveAd = async (adData) => {
    try {
      if (editingAd) {
        await FarmAd.update(editingAd.id, adData);
      } else {
        await FarmAd.create(adData);
      }
      setShowModal(false);
      setEditingAd(null);
      onRefresh();
    } catch (error) {
      console.error("Erro ao salvar anúncio:", error);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm("Tem certeza que deseja excluir este anúncio?")) {
      try {
        await FarmAd.delete(adId);
        onRefresh();
      } catch (error) {
        console.error("Erro ao excluir anúncio:", error);
      }
    }
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = Object.values(ad).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesCategory = filterCategory === "all" || ad.categoria === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: ads.length,
    ativos: ads.filter(a => a.status === 'ativo').length,
    pausados: ads.filter(a => a.status === 'pausado').length,
    totalComments: comments.length
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
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Ativos</CardTitle>
            <Play className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{stats.ativos}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Pausados</CardTitle>
            <Pause className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.pausados}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Comentários</CardTitle>
            <BarChart className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.totalComments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar anúncios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-600 text-slate-200"
                />
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="all">Todas as categorias</option>
                <option value="anotar">Anotar</option>
                <option value="genio-ia">Gênio IA</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            
            <Button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Anúncio
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
                  <TableHead className="text-slate-300">Título</TableHead>
                  <TableHead className="text-slate-300">Categoria</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Progresso</TableHead>
                  <TableHead className="text-slate-300">URLs</TableHead>
                  <TableHead className="text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.map((ad) => {
                  const totalMeta = (ad.metaInstagram || 0) + (ad.metaTiktok || 0) + (ad.metaFacebook || 0);
                  const progress = totalMeta > 0 ? ((ad.comentariosFeitos || 0) / totalMeta) * 100 : 0;
                  
                  return (
                    <TableRow 
                      key={ad.id} 
                      className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                    >
                      <TableCell>
                        <div className="font-medium text-slate-200">{ad.titulo}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {ad.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[ad.status] || statusColors.ativo}>
                          {ad.status || 'ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">
                              {ad.comentariosFeitos || 0} / {totalMeta}
                            </span>
                            <span className="text-slate-400">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {ad.urlInstagram && (
                            <Badge variant="outline" className="text-xs border-pink-500/30 text-pink-400">
                              IG
                            </Badge>
                          )}
                          {ad.urlTiktok && (
                            <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                              TT
                            </Badge>
                          )}
                          {ad.urlFacebook && (
                            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                              FB
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingAd(ad);
                              setShowModal(true);
                            }}
                            className="hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAd(ad.id)}
                            className="hover:bg-slate-700/50 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredAds.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum anúncio encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <AdModal
          ad={editingAd}
          onSave={handleSaveAd}
          onClose={() => {
            setShowModal(false);
            setEditingAd(null);
          }}
        />
      )}
    </div>
  );
}