import React, { useState, useEffect } from "react";
import { Influencer } from "@/entities/Influencer";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import InfluencerStats from "../components/influencers/InfluencerStats";
import InfluencerTable from "../components/influencers/InfluencerTable";
import InfluencerModal from "../components/influencers/InfluencerModal";

export default function Influencers() {
  const [influencers, setInfluencers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState(null);
  const [sortColumn, setSortColumn] = useState('created_date');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [influencersData, userData] = await Promise.all([
        Influencer.list('-created_date'),
        User.me()
      ]);
      setInfluencers(influencersData);
      setUser(userData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setLoading(false);
  };

  const handleSaveInfluencer = async (influencerData) => {
    try {
      if (editingInfluencer) {
        await Influencer.update(editingInfluencer.id, influencerData);
      } else {
        await Influencer.create(influencerData);
      }
      setShowModal(false);
      setEditingInfluencer(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar influenciador:", error);
    }
  };

  const handleEditInfluencer = (influencer) => {
    setEditingInfluencer(influencer);
    setShowModal(true);
  };

  const handleDeleteInfluencer = async (influencerId) => {
    if (window.confirm("Tem certeza que deseja excluir este influenciador?")) {
      try {
        await Influencer.delete(influencerId);
        loadData();
      } catch (error) {
        console.error("Erro ao excluir influenciador:", error);
      }
    }
  };

  const filteredInfluencers = influencers.filter(influencer =>
    Object.values(influencer).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedInfluencers = [...filteredInfluencers].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const exportToCSV = () => {
    const headers = ['Nome', 'Instagram', 'TikTok', 'Seguidores IG', 'Seguidores TT', 'Status', 'Valor', 'Nicho'];
    const csvContent = [
      headers.join(','),
      ...sortedInfluencers.map(inf => [
        inf.nome,
        inf.instagram,
        inf.tiktok,
        inf.seguidoresIG,
        inf.seguidoresTT,
        inf.status,
        inf.valor,
        inf.nicho
      ].map(field => `"${field || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'influenciadores.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Gestão de Influenciadores
            </h1>
            <p className="text-slate-400">Gerencie suas parcerias e campanhas</p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={influencers.length === 0}
              className="border-slate-600 hover:bg-slate-800/50 text-slate-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            
            <Button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Influenciador
            </Button>
          </div>
        </div>

        {/* Stats */}
        <InfluencerStats influencers={influencers} loading={loading} />

        {/* Search and Filters */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar influenciadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-600 text-slate-200 placeholder-slate-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <InfluencerTable
          influencers={sortedInfluencers}
          loading={loading}
          onEdit={handleEditInfluencer}
          onDelete={handleDeleteInfluencer}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={(column) => {
            if (sortColumn === column) {
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
              setSortColumn(column);
              setSortDirection('asc');
            }
          }}
        />

        {/* Modal */}
        {showModal && (
          <InfluencerModal
            influencer={editingInfluencer}
            onSave={handleSaveInfluencer}
            onClose={() => {
              setShowModal(false);
              setEditingInfluencer(null);
            }}
          />
        )}
      </div>
    </div>
  );
}