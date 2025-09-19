import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { db, auth } from "../src/firebaseConfig";
import { collection, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";

import KanbanColumn from '../components/crm/KanbanColumn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Clock, Target, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const columnsConfig = {
  'prospeccao': { id: 'prospeccao', title: 'Prospecção' },
  'contatado': { id: 'contatado', title: 'Contatado' },
  'follow_up': { id: 'follow_up', title: 'Follow Up' },
  'negociacao': { id: 'negociacao', title: 'Negociação' },
  'fechado': { id: 'fechado', title: 'Fechado' },
  'descartado': { id: 'descartado', title: 'Descartado' },
};

export default function CRM() {
  const [loading, setLoading] = useState(true);
  const [followUps, setFollowUps] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [user, setUser] = useState(null);
  const [columns, setColumns] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const followUpsCollectionRef = collection(db, "follow_ups");
        const influencersCollectionRef = collection(db, "influencers");

        const [followUpsSnapshot, influencersSnapshot] = await Promise.all([
            getDocs(followUpsCollectionRef),
            getDocs(influencersCollectionRef),
        ]);

        const followUpsData = followUpsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        const influencersData = influencersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        setFollowUps(followUpsData);
        setInfluencers(influencersData);
        setUser(auth.currentUser);

        const populatedColumns = JSON.parse(JSON.stringify(columnsConfig));
        for (const key in populatedColumns) {
            populatedColumns[key].cards = [];
        }

        followUpsData.forEach(fu => {
            if (populatedColumns[fu.status]) {
                populatedColumns[fu.status].cards.push(fu);
            }
        });

        setColumns(populatedColumns);

    } catch (error) {
        console.error("Erro ao buscar dados do CRM:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }
    
    // O resto da lógica de onDragEnd pode permanecer a mesma para a UI otimista,
    // mas a parte de atualização do Firebase precisa ser implementada.
    
    const card = followUps.find(fu => fu.id === draggableId);
    if (!card) return;

    // Atualiza o estado local para uma resposta de UI imediata
    const newColumns = { ...columns };
    const sourceColumn = newColumns[source.droppableId];
    const destColumn = newColumns[destination.droppableId];
    const [movedCard] = sourceColumn.cards.splice(source.index, 1);
    destColumn.cards.splice(destination.index, 0, movedCard);
    setColumns(newColumns);

    try {
      const followUpDoc = doc(db, "follow_ups", draggableId);
      await updateDoc(followUpDoc, { status: destination.droppableId });
      // Opcional: recarregar os dados para garantir consistência total
      // fetchData(); 
    } catch (error) {
      console.error("Falha ao atualizar status do follow-up:", error);
      // Reverter a mudança na UI em caso de erro
      fetchData();
    }
  };
  
  const addUnassignedInfluencers = async () => {
    const assignedInfluencerIds = new Set(followUps.map(fu => fu.influencerId));
    const unassigned = influencers.filter(inf => !assignedInfluencerIds.has(inf.id));
    
    if (unassigned.length > 0) {
      const followUpsCollectionRef = collection(db, "follow_ups");
      const newFollowUpsPromises = unassigned.map(inf => {
        const newFollowUp = {
          influencerId: inf.id,
          influencerName: inf.nome,
          influencerAvatar: inf.nome?.[0]?.toUpperCase() || '?',
          status: 'prospeccao',
          notes: 'Novo influenciador adicionado ao pipeline.',
          assignedTo: user?.email || 'unknown',
          nextActionDate: null
        };
        return addDoc(followUpsCollectionRef, newFollowUp);
      });
      await Promise.all(newFollowUpsPromises);
      fetchData();
    } else {
      alert("Todos os influenciadores já estão no pipeline.");
    }
  };


  const stats = {
    total: followUps.length,
    prospeccao: columns['prospeccao']?.cards?.length || 0,
    negociacao: columns['negociacao']?.cards?.length || 0,
    fechado: columns['fechado']?.cards?.length || 0
  };

  // O resto do seu código JSX continua aqui, sem alterações na renderização.
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-64 w-72" />
            <Skeleton className="h-64 w-72" />
            <Skeleton className="h-64 w-72" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              CRM Influenciadores
            </h1>
            <p className="text-slate-400">Pipeline de follow-ups e gestão de contatos</p>
          </div>
          
          <Button 
            onClick={addUnassignedInfluencers}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Sincronizar Influenciadores
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Prospecção</CardTitle>
              <Target className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.prospeccao}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Negociação</CardTitle>
              <Clock className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats.negociacao}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Fechados</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{stats.fechado}</div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {Object.values(columns).map(column => (
              <KanbanColumn key={column.id} column={column} cards={column.cards} />
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}