import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { renderLayout } from './shared.js';

let columns = {};
let followUps = [];
let influencers = [];
let user = null;

const columnsConfig = {
  'prospeccao': { id: 'prospeccao', title: 'Prospecção', cards: [] },
  'contatado': { id: 'contatado', title: 'Contatado', cards: [] },
  'follow_up': { id: 'follow_up', title: 'Follow Up', cards: [] },
  'negociacao': { id: 'negociacao', title: 'Negociação', cards: [] },
  'fechado': { id: 'fechado', title: 'Fechado', cards: [] },
  'descartado': { id: 'descartado', title: 'Descartado', cards: [] },
};

async function fetchData() {
    try {
        const followUpsCollectionRef = collection(db, "follow_ups");
        const influencersCollectionRef = collection(db, "influencers");

        const [followUpsSnapshot, influencersSnapshot] = await Promise.all([
            getDocs(followUpsCollectionRef),
            getDocs(influencersCollectionRef),
        ]);

        followUps = followUpsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        influencers = influencersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        const populatedColumns = JSON.parse(JSON.stringify(columnsConfig));
        followUps.forEach(fu => {
            if (populatedColumns[fu.status]) {
                populatedColumns[fu.status].cards.push(fu);
            }
        });
        columns = populatedColumns;

        renderPage();
    } catch (error) {
        console.error("Erro ao buscar dados do CRM:", error);
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = `<div>Erro ao carregar dados.</div>`;
        }
    }
}

function renderStats() {
    const stats = {
        total: followUps.length,
        prospeccao: columns['prospeccao']?.cards?.length || 0,
        negociacao: columns['negociacao']?.cards?.length || 0,
        fechado: columns['fechado']?.cards?.length || 0
    };
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-gray-800 rounded-lg p-5 animated slide-in-up stagger-1"><div class="flex items-center justify-between"><h3 class="text-sm font-medium text-gray-400">Total</h3><i data-lucide="users" class="h-4 w-4 text-blue-400"></i></div><div class="text-2xl font-bold text-blue-400 mt-2">${stats.total}</div></div>
                <div class="bg-gray-800 rounded-lg p-5 animated slide-in-up stagger-2"><div class="flex items-center justify-between"><h3 class="text-sm font-medium text-gray-400">Prospecção</h3><i data-lucide="target" class="h-4 w-4 text-yellow-400"></i></div><div class="text-2xl font-bold text-yellow-400 mt-2">${stats.prospeccao}</div></div>
                <div class="bg-gray-800 rounded-lg p-5 animated slide-in-up stagger-3"><div class="flex items-center justify-between"><h3 class="text-sm font-medium text-gray-400">Negociação</h3><i data-lucide="clock" class="h-4 w-4 text-purple-400"></i></div><div class="text-2xl font-bold text-purple-400 mt-2">${stats.negociacao}</div></div>
                <div class="bg-gray-800 rounded-lg p-5 animated slide-in-up stagger-4"><div class="flex items-center justify-between"><h3 class="text-sm font-medium text-gray-400">Fechados</h3><i data-lucide="trending-up" class="h-4 w-4 text-green-400"></i></div><div class="text-2xl font-bold text-green-400 mt-2">${stats.fechado}</div></div>
            </div>
        `;
    }
}

function renderKanbanBoard() {
    const boardContainer = document.getElementById('kanban-board');
    if (boardContainer) {
        boardContainer.innerHTML = `
            <div class="flex gap-6 overflow-x-auto pb-4 animated slide-in-up">
                ${Object.values(columns).map(column => `
                    <div class="bg-gray-800/90 rounded-xl w-[300px] flex-shrink-0">
                        <h3 class="text-base font-semibold text-gray-200 p-4 border-b border-gray-700 capitalize">
                            ${column.title.replace('_', ' ')}
                            <span class="ml-2 text-sm font-normal text-gray-400">${column.cards.length}</span>
                        </h3>
                        <div class="p-4 min-h-[200px] droppable" data-column-id="${column.id}">
                            ${column.cards.map((card) => `
                                <div class="mb-3 p-3 bg-gray-700/80 border border-gray-600 rounded-lg draggable cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:shadow-lg" draggable="true" data-card-id="${card.id}">
                                    <div class="flex items-start justify-between">
                                        <p class="font-semibold text-gray-200 text-sm mb-2 w-full pr-2">${card.influencerName}</p>
                                        <div class="flex-shrink-0 h-7 w-7 bg-purple-500/20 rounded-full flex items-center justify-center text-xs text-purple-300 font-bold">${card.influencerAvatar || '?'}</div>
                                    </div>
                                    <p class="text-xs text-gray-400 mb-1 line-clamp-3">${card.notes || 'Nenhuma anotação'}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function renderPage() {
    const pageContent = `
        <div class="max-w-7xl mx-auto p-6 animated fade-in">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-100">CRM Influenciadores</h1>
                    <p class="text-gray-400 mt-1">Pipeline de follow-ups e gestão de contatos</p>
                </div>
                <button id="sync-influencers" class="bg-green-500 hover:opacity-90 text-white font-semibold py-2 px-4 rounded-md flex items-center">
                    <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                    Sincronizar Influenciadores
                </button>
            </div>
            <div id="stats-container"></div>
            <div id="kanban-board"></div>
            <div id="modal-container"></div>
        </div>
    `;
    
    renderLayout(user, pageContent);
    renderStats();
    renderKanbanBoard();
    attachEventListeners();
    lucide.createIcons();
}

function attachEventListeners() {
    const syncButton = document.getElementById('sync-influencers');
    if (syncButton) {
        syncButton.addEventListener('click', addUnassignedInfluencers);
    }
    
    const draggables = document.querySelectorAll('.draggable');
    const droppables = document.querySelectorAll('.droppable');
    
    draggables.forEach(draggable => {
        draggable.addEventListener('click', () => {
            const cardId = draggable.dataset.cardId;
            openEditCardModal(cardId);
        });

        draggable.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            e.target.classList.add('dragging');
        });

        draggable.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            droppables.forEach(d => d.classList.remove('drag-over'));
        });
    });

    droppables.forEach(droppable => {
        droppable.addEventListener('dragover', e => e.preventDefault());
        droppable.addEventListener('dragenter', e => e.currentTarget.classList.add('drag-over'));
        droppable.addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
        droppable.addEventListener('drop', handleDrop);
    });
}

async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const targetColumn = e.currentTarget;
    const draggedItem = document.querySelector('.dragging');
    
    if (!draggedItem) return;

    const originalColumnId = draggedItem.closest('.droppable').dataset.columnId;
    
    targetColumn.classList.remove('drag-over');

    const cardId = draggedItem.dataset.cardId;
    const newStatus = targetColumn.dataset.columnId;

    if (originalColumnId === newStatus) return;
    
    try {
        const followUpDoc = doc(db, "follow_ups", cardId);
        await updateDoc(followUpDoc, { status: newStatus });

        const cardIndex = columns[originalColumnId].cards.findIndex(c => c.id === cardId);
        if (cardIndex > -1) {
            const [cardToMove] = columns[originalColumnId].cards.splice(cardIndex, 1);
            cardToMove.status = newStatus;
            columns[newStatus].cards.push(cardToMove);
        }

        renderKanbanBoard();
        renderStats();
        attachEventListeners();
        lucide.createIcons();

    } catch (error) {
        console.error("Falha ao atualizar status do follow-up:", error);
        alert("Não foi possível mover o card. A página será atualizada.");
        fetchData();
    }
}

// ATUALIZADO: Adiciona o botão de excluir no modal
function openEditCardModal(cardId) {
    let cardData = null;
    let cardColumnId = null;

    for (const columnId in columns) {
        const foundCard = columns[columnId].cards.find(c => c.id === cardId);
        if (foundCard) {
            cardData = foundCard;
            cardColumnId = columnId;
            break;
        }
    }

    if (!cardData) return;

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animated fade-in">
            <div class="bg-gray-800 border border-slate-700 rounded-lg p-8 w-full max-w-lg shadow-2xl animated scale-in">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-emerald-400">Editar Card: ${cardData.influencerName}</h2>
                    <button id="close-modal-btn" class="text-slate-400 hover:text-white">&times;</button>
                </div>
                <form id="edit-card-form">
                    <input type="hidden" name="cardId" value="${cardData.id}">
                    <input type="hidden" name="columnId" value="${cardColumnId}">
                    <div>
                        <label class="text-sm font-medium text-slate-300">Anotações</label>
                        <textarea name="notes" rows="5" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">${cardData.notes || ''}</textarea>
                    </div>
                    <div class="flex justify-between items-center pt-6">
                        <button type="button" id="delete-card-btn" class="px-6 py-2 bg-red-600 text-white rounded font-semibold hover:opacity-90 flex items-center gap-2">
                            <i data-lucide="trash-2" class="w-4 h-4"></i> Excluir
                        </button>
                        <div class="flex justify-end gap-4">
                            <button type="button" id="cancel-modal-btn" class="px-6 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-700">Cancelar</button>
                            <button type="submit" class="px-6 py-2 bg-green-500 text-white rounded font-semibold hover:opacity-90">Salvar</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('edit-card-form').addEventListener('submit', handleSaveCard);
    document.getElementById('delete-card-btn').addEventListener('click', handleDeleteCard);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    lucide.createIcons();
}

async function handleSaveCard(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const cardId = formData.get('cardId');
    const columnId = formData.get('columnId');
    const newNotes = formData.get('notes');

    try {
        const cardDoc = doc(db, "follow_ups", cardId);
        await updateDoc(cardDoc, { notes: newNotes });

        const cardIndex = columns[columnId].cards.findIndex(c => c.id === cardId);
        if (cardIndex > -1) {
            columns[columnId].cards[cardIndex].notes = newNotes;
        }

        closeModal();
        renderKanbanBoard();
        attachEventListeners();
        lucide.createIcons();

    } catch(error) {
        console.error("Erro ao salvar anotações:", error);
        alert("Não foi possível salvar as alterações.");
    }
}

// NOVA FUNÇÃO: Deleta um card do Kanban
async function handleDeleteCard(e) {
    const form = e.target.closest('form');
    const cardId = form.querySelector('input[name="cardId"]').value;
    const columnId = form.querySelector('input[name="columnId"]').value;

    if (window.confirm("Tem certeza que deseja excluir este card do pipeline? Esta ação não pode ser desfeita.")) {
        try {
            // Deleta do Firestore
            const cardDoc = doc(db, "follow_ups", cardId);
            await deleteDoc(cardDoc);

            // Remove do estado local
            const cardIndex = columns[columnId].cards.findIndex(c => c.id === cardId);
            if (cardIndex > -1) {
                columns[columnId].cards.splice(cardIndex, 1);
            }
            
            const followUpIndex = followUps.findIndex(fu => fu.id === cardId);
             if (followUpIndex > -1) {
                followUps.splice(followUpIndex, 1);
            }

            closeModal();
            renderKanbanBoard();
            renderStats();
            attachEventListeners();
            lucide.createIcons();

        } catch(error) {
            console.error("Erro ao excluir card:", error);
            alert("Não foi possível excluir o card.");
        }
    }
}

function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
}

async function addUnassignedInfluencers(event) {
    const button = event.currentTarget;
    button.disabled = true;
    button.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4 mr-2 animate-spin"></i> Sincronizando...';
    lucide.createIcons();

    const assignedInfluencerIds = new Set(followUps.map(fu => fu.influencerId));
    const unassigned = influencers.filter(inf => !assignedInfluencerIds.has(inf.id));

    if (unassigned.length > 0) {
        const followUpsCollectionRef = collection(db, "follow_ups");
        const newFollowUpsPromises = unassigned.map(inf => {
            const newFollowUp = {
                influencerId: inf.id,
                influencerName: inf.nome || 'Nome não informado',
                influencerAvatar: inf.nome?.[0]?.toUpperCase() || '?',
                status: 'prospeccao',
                notes: 'Novo influenciador adicionado ao pipeline.',
                assignedTo: user?.email || 'unknown',
            };
            return addDoc(followUpsCollectionRef, newFollowUp);
        });
        await Promise.all(newFollowUpsPromises);
        await fetchData(); 
    } else {
        alert("Todos os influenciadores já estão no pipeline.");
    }
    
    button.disabled = false;
    button.innerHTML = '<i data-lucide="plus" class="w-4 h-4 mr-2"></i> Sincronizar Influenciadores';
    lucide.createIcons();
}


document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            user = currentUser;
            fetchData();
        }
    });
});