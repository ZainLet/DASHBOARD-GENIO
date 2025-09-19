import React, { useState, useEffect, useCallback } from "react";
import { db, auth } from "../src/firebaseConfig"; // Importe o db do Firebase
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy,
  query
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import InfluencerStats from "../components/influencers/InfluencerStats";
import InfluencerTable from "../components/influencers/InfluencerTable";
import InfluencerModal from "../components/influencers/InfluencerModal";

export default function Influencers() {
  const [influencers, setInfluencers] = useState([]);
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState(null);
  const [sortColumn, setSortColumn] = useState('nome');
  const [sortDirection, setSortDirection] = useState('asc');

  // Referência para a coleção no Firestore
  const influencersCollectionRef = collection(db, "influencers");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(influencersCollectionRef, orderBy(sortColumn, sortDirection));
      const data = await getDocs(q);
      const influencersData = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setInfluencers(influencersData);
    } catch (error) {
      console.error("Erro ao carregar dados do Firestore:", error);
    }
    setLoading(false);
  }, [sortColumn, sortDirection]); // Adicione dependências para recarregar ao ordenar

  useEffect(() => {
    // Carrega os dados quando o componente monta ou a ordenação muda
    loadData();
    // Atualiza o usuário
    setUser(auth.currentUser);
  }, [loadData]);

  const handleSaveInfluencer = async (influencerData) => {
    try {
      if (editingInfluencer) {
        // Atualiza um documento existente
        const influencerDoc = doc(db, "influencers", editingInfluencer.id);
        await updateDoc(influencerDoc, influencerData);
      } else {
        // Adiciona um novo documento
        await addDoc(influencersCollectionRef, influencerData);
      }
      setShowModal(false);
      setEditingInfluencer(null);
      loadData(); // Recarrega os dados
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
        const influencerDoc = doc(db, "influencers", influencerId);
        await deleteDoc(influencerDoc);
        loadData(); // Recarrega os dados
      } catch (error) {
        console.error("Erro ao excluir influenciador:", error);
      }
    }
  };
  
  // A lógica de filtragem continua a mesma
  const filteredInfluencers = influencers.filter(influencer =>
    Object.values(influencer).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  // A ordenação agora é feita na query do Firestore, então podemos remover o .sort() local
  const sortedInfluencers = filteredInfluencers;

  // A função exportToCSV continua a mesma
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
        {/* Header (sem alterações) */}
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

        {/* Stats (sem alterações) */}
        <InfluencerStats influencers={influencers} loading={loading} />

        {/* Search and Filters (sem alterações) */}
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

        {/* Modal (sem alterações) */}
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