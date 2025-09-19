import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ column, cards }) {
  return (
    <div className="bg-slate-800/60 rounded-xl w-[300px] flex-shrink-0">
      <h3 className="text-base font-semibold text-slate-200 p-4 border-b border-slate-700 capitalize">
        {column.title.replace('_', ' ')}
        <span className="ml-2 text-sm font-normal text-slate-400">{cards.length}</span>
      </h3>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-4 transition-colors duration-200 min-h-[200px] ${
              snapshot.isDraggingOver ? 'bg-emerald-500/10' : ''
            }`}
          >
            {cards.map((card, index) => (
              <KanbanCard key={card.id} card={card} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}