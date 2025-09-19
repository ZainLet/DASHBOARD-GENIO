import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Influencer } from '@/entities/Influencer';
import { FollowUp } from '@/entities/FollowUp';
import { User } from '@/entities/User';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [followUpsData, influencersData, userData] = await Promise.all([
        FollowUp.list(),
        Influencer.list(),
        User.me()
      ]);
      setFollowUps(followUpsData);
      setInfluencers(influencersData);
      setUser(userData);
      
      const populatedColumns = { ...columnsConfig };
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
  };
  
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId)) {
      return;
    }

    const startColumn = columns[source.droppableId];
    const endColumn = columns[destination.droppableId];
    
    const card = followUps.find(fu => fu.id === draggableId);
    
    // Optimistic UI update
    const newStartCards = Array.from(startColumn.cards);
    newStartCards.splice(source.index, 1);
    
    const newEndCards = Array.from(endColumn.cards);
    newEndCards.splice(destination.index, 0, card);

    setColumns(prev => ({
      ...prev,
      [startColumn.id]: {
        ...startColumn,
        cards: newStartCards
      },
      [endColumn.id]: {
        ...endColumn,
        cards: newEndCards
      }
    }));
    
    try {
      await FollowUp.update(draggableId, { status: destination.droppableId });
      fetchData();
    } catch (error) {
      console.error("Falha ao atualizar status do follow-up:", error);
      // Revert state on failure
      setColumns(prev => {
        const revertedStartCards = Array.from(endColumn.cards);
        revertedStartCards.splice(destination.index, 1);

        const revertedEndCards = Array.from(startColumn.cards);
        revertedEndCards.splice(source.index, 0, card);
        
        return {
          ...prev,
          [startColumn.id]: { ...startColumn, cards: revertedEndCards },
          [endColumn.id]: { ...endColumn, cards: revertedStartCards },
        };
      });
    }
  };

  const addUnassignedInfluencers = async () => {
    const assignedInfluencerIds = followUps.map(fu => fu.influencerId);
    const unassigned = influencers.filter(inf => !assignedInfluencerIds.includes(inf.id));
    
    if (unassigned.length > 0) {
      const newFollowUps = unassigned.map(inf => ({
        influencerId: inf.id,
        influencerName: inf.nome,
        influencerAvatar: inf.nome?.[0]?.toUpperCase() || '?',
        status: 'prospeccao',
        notes: 'Novo influenciador adicionado ao pipeline.',
        assignedTo: user?.email || 'unknown'
      }));
      await FollowUp.bulkCreate(newFollowUps);
      fetchData();
    } else {
      alert("Todos os influenciadores já estão no pipeline.");
    }
  };

  const stats = {
    total: followUps.length,
    prospeccao: followUps.filter(f => f.status === 'prospeccao').length,
    negociacao: followUps.filter(f => f.status === 'negociacao').length,
    fechado: followUps.filter(f => f.status === 'fechado').length
  };

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