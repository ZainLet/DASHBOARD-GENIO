import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Influencer } from '@/entities/Influencer';
import { FollowUp } from '@/entities/FollowUp';
import KanbanColumn from './crm/KanbanColumn';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const columnsConfig = {
  'prospeccao': { id: 'prospeccao', title: 'Prospecção' },
  'contatado': { id: 'contatado', title: 'Contatado' },
  'follow_up': { id: 'follow_up', title: 'Follow Up' },
  'negociacao': { id: 'negociacao', title: 'Negociação' },
  'fechado': { id: 'fechado', title: 'Fechado' },
  'descartado': { id: 'descartado', title: 'Descartado' },
};

export default function CRMTab({ user }) {
  const [loading, setLoading] = useState(true);
  const [followUps, setFollowUps] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [columns, setColumns] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [followUpsData, influencersData] = await Promise.all([
        FollowUp.list(),
        Influencer.list()
      ]);
      setFollowUps(followUpsData);
      setInfluencers(influencersData);
      
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
      // If server update fails, we would ideally revert the state.
      // For now, we refresh to ensure consistency.
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
        assignedTo: user.email
      }));
      await FollowUp.bulkCreate(newFollowUps);
      fetchData();
    } else {
      alert("Todos os influenciadores já estão no pipeline.");
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-64 w-72" />
          <Skeleton className="h-64 w-72" />
          <Skeleton className="h-64 w-72" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-200">Pipeline de Follow-ups</h2>
        <Button onClick={addUnassignedInfluencers}>
          <Plus className="w-4 h-4 mr-2" />
          Sincronizar Influenciadores
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {Object.values(columns).map(column => (
            <KanbanColumn key={column.id} column={column} cards={column.cards} />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}