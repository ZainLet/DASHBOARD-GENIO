import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
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
    document.getElementById('app-content').innerHTML = `<div>Carregando...</div>`;
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
        document.getElementById('app-content').innerHTML = `<div>Erro ao carregar dados.</div>`;
    }
}

function renderStats() {
    const stats = {
        total: followUps.length,
        prospeccao: columns['prospeccao']?.cards?.length || 0,
        negociacao: columns['negociacao']?.cards?.length || 0,
        fechado: columns['fechado']?.cards?.length || 0
    };
    return `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4">
                <div class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 class="text-sm font-medium text-slate-300">Total</h3>
                    <i data-lucide="users" class="h-4 w-4 text-blue-400"></i>
                </div>
                <div class="text-2xl font-bold text-blue-400">${stats.total}</div>
            </div>
            <div class="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4">
                <div class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 class="text-sm font-medium text-slate-300">Prospecção</h3>
                    <i data-lucide="target" class="h-4 w-4 text-yellow-400"></i>
                </div>
                <div class="text-2xl font-bold text-yellow-400">${stats.prospeccao}</div>
            </div>
            <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
                <div class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 class="text-sm font-medium text-slate-300">Negociação</h3>
                    <i data-lucide="clock" class="h-4 w-4 text-purple-400"></i>
                </div>
                <div class="text-2xl font-bold text-purple-400">${stats.negociacao}</div>
            </div>
            <div class="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-lg p-4">
                <div class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 class="text-sm font-medium text-slate-300">Fechados</h3>
                    <i data-lucide="trending-up" class="h-4 w-4 text-emerald-400"></i>
                </div>
                <div class="text-2xl font-bold text-emerald-400">${stats.fechado}</div>
            </div>
        </div>
    `;
}

function renderKanbanBoard() {
    return `
        <div id="kanban-board" class="flex gap-6 overflow-x-auto pb-4">
            ${Object.values(columns).map(column => `
                <div class="bg-slate-800/60 rounded-xl w-[300px] flex-shrink-0">
                    <h3 class="text-base font-semibold text-slate-200 p-4 border-b border-slate-700 capitalize">
                        ${column.title.replace('_', ' ')}
                        <span class="ml-2 text-sm font-normal text-slate-400">${column.cards.length}</span>
                    </h3>
                    <div class="p-4 min-h-[200px] droppable" data-column-id="${column.id}">
                        ${column.cards.map((card, index) => `
                            <div class="mb-3 p-3 bg-slate-700/50 border-slate-600 rounded-lg draggable" draggable="true" data-card-id="${card.id}" data-index="${index}">
                                <p class="font-semibold text-slate-200 text-sm mb-2">${card.influencerName}</p>
                                <p class="text-xs text-slate-400 mb-3 line-clamp-2">${card.notes || 'Nenhuma anotação'}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderPage() {
    const pageContent = `
        <div class="max-w-7xl mx-auto">
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        CRM Influenciadores
                    </h1>
                    <p class="text-slate-400">Pipeline de follow-ups e gestão de contatos</p>
                </div>
                <button id="sync-influencers" class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2 px-4 rounded flex items-center">
                    <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                    Sincronizar Influenciadores
                </button>
            </div>
            ${renderStats()}
            ${renderKanbanBoard()}
        </div>
    `;
    
    document.getElementById('app-content').innerHTML = pageContent;
    renderLayout(user, document.getElementById('app-content').innerHTML);
    attachEventListeners();
    lucide.createIcons();
}

function attachEventListeners() {
    document.getElementById('sync-influencers').addEventListener('click', addUnassignedInfluencers);
    
    // Drag and Drop Logic
    const draggables = document.querySelectorAll('.draggable');
    const droppables = document.querySelectorAll('.droppable');
    let draggedItem = null;

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            setTimeout(() => {
                e.target.style.display = 'none';
            }, 0);
        });

        draggable.addEventListener('dragend', (e) => {
            setTimeout(() => {
                draggedItem.style.display = 'block';
                draggedItem = null;
            }, 0);
        });
    });

    droppables.forEach(droppable => {
        droppable.addEventListener('dragover', e => {
            e.preventDefault();
        });
        droppable.addEventListener('drop', async (e) => {
            e.preventDefault();
            if (draggedItem) {
                const cardId = draggedItem.dataset.cardId;
                const newStatus = e.currentTarget.dataset.columnId;
                
                // Optimistic UI update
                e.currentTarget.appendChild(draggedItem);

                try {
                    const followUpDoc = doc(db, "follow_ups", cardId);
                    await updateDoc(followUpDoc, { status: newStatus });
                    // No need to call fetchData(), UI is already updated. 
                    // Consider a light refresh or state update if more complex data changes.
                } catch (error) {
                    console.error("Falha ao atualizar status do follow-up:", error);
                    // Revert UI on error
                    fetchData(); 
                }
            }
        });
    });
}

async function addUnassignedInfluencers() {
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
}


document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.createElement('div');
    appContent.id = 'app-content';
    document.getElementById('app').appendChild(appContent);

    onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            user = currentUser;
            fetchData();
        }
    });
});