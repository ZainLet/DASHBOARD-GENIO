import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function KanbanCard({ card, index }) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
        >
          <Card 
            className={`bg-slate-700/50 border-slate-600 hover:bg-slate-700/80 transition-colors duration-200 ${
              snapshot.isDragging ? 'ring-2 ring-emerald-500 shadow-lg' : ''
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-200 text-sm mb-2">{card.influencerName}</p>
                <div className="w-7 h-7 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {card.influencerAvatar}
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">{card.notes || 'Nenhuma anotação'}</p>
              {card.nextActionDate && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs border-slate-500 text-slate-300 w-fit">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(card.nextActionDate), 'dd/MM/yyyy')}
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}