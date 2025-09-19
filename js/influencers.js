import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { renderLayout } from './shared.js';

let influencers = [];
let sortColumn = 'nome';
let sortDirection = 'asc';
let searchTerm = '';
let editingInfluencer = null;

const influencersCollectionRef = collection(db, "influencers");

// --- DATA FUNCTIONS ---
async function loadData() {
    document.getElementById('app-content').innerHTML = `<div>Carregando...</div>`;
    try {
        const q = query(influencersCollectionRef, orderBy(sortColumn, sortDirection));
        const data = await getDocs(q);
        influencers = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        renderPage();
    } catch (error) {
        console.error("Erro ao carregar dados do Firestore:", error);
        document.getElementById('app-content').innerHTML = `<div>Erro ao carregar dados.</div>`;
    }
}

async function handleSaveInfluencer(influencerData) {
    try {
        if (editingInfluencer) {
            const influencerDoc = doc(db, "influencers", editingInfluencer.id);
            await updateDoc(influencerDoc, influencerData);
        } else {
            await addDoc(influencersCollectionRef, influencerData);
        }
        closeModal();
        loadData();
    } catch (error) {
        console.error("Erro ao salvar influenciador:", error);
    }
}

async function handleDeleteInfluencer(influencerId) {
    if (window.confirm("Tem certeza que deseja excluir este influenciador?")) {
        try {
            const influencerDoc = doc(db, "influencers", influencerId);
            await deleteDoc(influencerDoc);
            loadData();
        } catch (error) {
            console.error("Erro ao excluir influenciador:", error);
        }
    }
}

// --- RENDER FUNCTIONS ---
function renderPage() {
    const user = auth.currentUser;
    const content = `
        <div class="max-w-7xl mx-auto">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 class="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        Gestão de Influenciadores
                    </h1>
                    <p class="text-slate-400">Gerencie suas parcerias e campanhas</p>
                </div>
                <div class="flex gap-3 flex-wrap">
                    <button id="export-csv-btn" class="flex items-center gap-2 px-4 py-2 border border-slate-600 rounded-md hover:bg-slate-800/50 text-slate-300">
                        <i data-lucide="download" class="w-4 h-4"></i> Exportar CSV
                    </button>
                    <button id="add-influencer-btn" class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-md">
                        <i data-lucide="plus" class="w-4 h-4"></i> Novo Influenciador
                    </button>
                </div>
            </div>
            <div id="stats-container"></div>
            <div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700 mb-6 rounded-lg p-6">
                <div class="relative">
                    <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4"></i>
                    <input id="search-input" type="text" placeholder="Buscar influenciadores..." class="w-full pl-10 pr-4 py-2 bg-slate-900/50 border-slate-600 text-slate-200 placeholder-slate-400 rounded-md">
                </div>
            </div>
            <div id="table-container"></div>
        </div>
        <div id="modal-container" class="hidden"></div>
    `;

    document.getElementById('app-content').innerHTML = content;
    
    renderLayout(user, document.getElementById('app-content').innerHTML);
    
    renderStats();
    renderTable();
    attachEventListeners();
    lucide.createIcons();
}


function renderStats() {
    const stats = {
        total: influencers.length,
        ativos: influencers.filter(inf => inf.status === 'ativo').length,
        conversoes: influencers.reduce((sum, inf) => sum + (inf.conversoes || 0), 0),
        investimento: influencers.reduce((sum, inf) => sum + (inf.valor || 0), 0)
    };
    
    const container = document.getElementById('stats-container');
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-6"><div class="text-sm text-slate-300">Total</div><div class="text-2xl font-bold text-blue-400">${stats.total}</div></div>
            <div class="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-lg p-6"><div class="text-sm text-slate-300">Ativos</div><div class="text-2xl font-bold text-emerald-400">${stats.ativos}</div></div>
            <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6"><div class="text-sm text-slate-300">Conversões</div><div class="text-2xl font-bold text-purple-400">${stats.conversoes}</div></div>
            <div class="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-6"><div class="text-sm text-slate-300">Investimento</div><div class="text-2xl font-bold text-orange-400">R$ ${stats.investimento.toLocaleString('pt-BR')}</div></div>
        </div>
    `;
}

function renderTable() {
    const container = document.getElementById('table-container');
    const filteredInfluencers = influencers.filter(influencer =>
        Object.values(influencer).some(value =>
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
    
    const statusColors = {
        'prospeccao': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'nao-fechou': 'bg-red-500/20 text-red-400 border-red-500/30',
        'negociacao': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'ativo': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'pausado': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    
    container.innerHTML = `
        <div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-lg overflow-x-auto">
            <table class="w-full text-sm text-left text-slate-300">
                <thead class="text-xs text-slate-400 uppercase bg-slate-700/50">
                    <tr>
                        <th scope="col" class="px-6 py-3"><button class="sort-btn" data-column="nome">Nome</button></th>
                        <th scope="col" class="px-6 py-3"><button class="sort-btn" data-column="instagram">Instagram</button></th>
                        <th scope="col" class="px-6 py-3"><button class="sort-btn" data-column="seguidoresIG">Seguidores</button></th>
                        <th scope="col" class="px-6 py-3"><button class="sort-btn" data-column="status">Status</button></th>
                        <th scope="col" class="px-6 py-3"><button class="sort-btn" data-column="valor">Valor</button></th>
                        <th scope="col" class="px-6 py-3"><button class="sort-btn" data-column="nicho">Nicho</button></th>
                        <th scope="col" class="px-6 py-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredInfluencers.map(inf => `
                        <tr class="border-b border-slate-700 hover:bg-slate-700/30">
                            <td class="px-6 py-4 font-medium text-slate-200">${inf.nome}</td>
                            <td class="px-6 py-4"><a href="https://instagram.com/${inf.instagram.replace('@','')}" target="_blank" class="text-emerald-400 hover:underline">${inf.instagram}</a></td>
                            <td class="px-6 py-4">${(inf.seguidoresIG || 0).toLocaleString('pt-BR')}</td>
                            <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full ${statusColors[inf.status] || ''}">${inf.status}</span></td>
                            <td class="px-6 py-4">R$ ${(inf.valor || 0).toLocaleString('pt-BR')}</td>
                            <td class="px-6 py-4">${inf.nicho || '-'}</td>
                            <td class="px-6 py-4 flex items-center gap-2">
                                <button class="edit-btn" data-id="${inf.id}"><i data-lucide="edit" class="w-4 h-4"></i></button>
                                <button class="delete-btn" data-id="${inf.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    lucide.createIcons();
}

function openModal(influencer = null) {
    editingInfluencer = influencer;
    const modalContainer = document.getElementById('modal-container');
    modalContainer.classList.remove('hidden');
    // ... (Código para renderizar o formulário do modal)
}

function closeModal() {
    editingInfluencer = null;
    const modalContainer = document.getElementById('modal-container');
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML = '';
}

function attachEventListeners() {
    document.getElementById('add-influencer-btn').addEventListener('click', () => openModal());
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchTerm = e.target.value;
        renderTable();
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const influencer = influencers.find(inf => inf.id === id);
            openModal(influencer);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleDeleteInfluencer(e.currentTarget.dataset.id);
        });
    });
    
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const column = e.currentTarget.dataset.column;
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }
            loadData();
        });
    });
}


document.addEventListener('DOMContentLoaded', () => {
    // A verificação onAuthStateChanged já cuida do redirecionamento
    // e chama loadData() quando o usuário está logado.
    const appContent = document.createElement('div');
    appContent.id = 'app-content';
    document.getElementById('app').appendChild(appContent);
    
    onAuthStateChanged(auth, (user) => {
        if(user) {
            loadData();
        }
    });
});