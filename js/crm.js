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
    return `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-gray-800 rounded-lg p-5 animated slide-in-up stagger-1">
                <div class="flex items-center justify-between"><h3 class="text-sm font-medium text-gray-400">Total</h3><i data-lucide="users" class="h-4 w-4 text-blue-400"></i></div>
                <div class="text-2xl font-bold text-blue-400 mt-2">${stats.total}</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-5 animated slide-in-up stagger-2">
                <div class="flex items-center justify-between"><h3 class="text-sm font-medium text-gray-400">Prospecção</h3><i data-lucide="target" class="h-4 w-4 text-yellow-400"></i></div>
                <div class="text-2xl font-bold text-yellow-400 mt-2">${stats.prospeccao}</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-5 animated slide-in-up stagger-3">
                <div class="flex items-center justify-between"><h3 class="text-sm font-medium text-gray-400">Negociação</h3><i data-lucide="clock" class="h-4 w-4 text-purple-400"></i></div>
                <div class="text-2xl font-bold text-purple-400 mt-2">${stats.negociacao}</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-5 animated slide-in-up stagger-4">
                <div class="flex items-center justify-between"><h3 class="text-sm font-medium text-gray-400">Fechados</h3><i data-lucide="trending-up" class="h-4 w-4 text-green-400"></i></div>
                <div class="text-2xl font-bold text-green-400 mt-2">${stats.fechado}</div>
            </div>
        </div>
    `;
}

function renderKanbanBoard() {
    return `
        <div id="kanban-board" class="flex gap-6 overflow-x-auto pb-4 animated slide-in-up">
            ${Object.values(columns).map(column => `
                <div class="bg-gray-800 rounded-xl w-[300px] flex-shrink-0">
                    <h3 class="text-base font-semibold text-gray-200 p-4 border-b border-gray-700 capitalize">
                        ${column.title.replace('_', ' ')}
                        <span class="ml-2 text-sm font-normal text-gray-400">${column.cards.length}</span>
                    </h3>
                    <div class="p-4 min-h-[200px] droppable" data-column-id="${column.id}">
                        ${column.cards.map((card, index) => `
                            <div class="mb-3 p-3 bg-gray-700 border-gray-600 rounded-lg draggable cursor-grab active:cursor-grabbing" draggable="true" data-card-id="${card.id}" data-index="${index}">
                                <p class="font-semibold text-gray-200 text-sm mb-2">${card.influencerName}</p>
                                <p class="text-xs text-gray-400 mb-3 line-clamp-2">${card.notes || 'Nenhuma anotação'}</p>
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
            ${renderStats()}
            ${renderKanbanBoard()}
        </div>
    `;
    
    renderLayout(user, pageContent);
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
    let draggedItem = null;

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            e.target.classList.add('opacity-50');
            setTimeout(() => {
                e.target.style.visibility = 'hidden';
            }, 0);
        });

        draggable.addEventListener('dragend', (e) => {
            e.target.classList.remove('opacity-50');
            e.target.style.visibility = 'visible';
            draggedItem = null;
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
                
                e.currentTarget.appendChild(draggedItem);

                try {
                    const followUpDoc = doc(db, "follow_ups", cardId);
                    await updateDoc(followUpDoc, { status: newStatus });
                } catch (error) {
                    console.error("Falha ao atualizar status do follow-up:", error);
                    fetchData(); 
                }
            }
        });
    });
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
                nextActionDate: null
            };
            return addDoc(followUpsCollectionRef, newFollowUp);
        });
        await Promise.all(newFollowUpsPromises);
        await fetchData(); 
    } else {
        alert("Todos os influenciadores já estão no pipeline.");
        button.disabled = false;
        button.innerHTML = '<i data-lucide="plus" class="w-4 h-4 mr-2"></i> Sincronizar Influenciadores';
        lucide.createIcons();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            user = currentUser;
            fetchData();
        }
    });
});