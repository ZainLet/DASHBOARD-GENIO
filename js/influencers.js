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
    query,
    where,
    limit,
    startAfter
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { renderLayout } from './shared.js';

let influencers = [];
let sortColumn = 'nome';
let sortDirection = 'asc';
let searchTerm = '';
let editingInfluencer = null;
let lastVisible = null;
let isLoading = false;

const influencersCollectionRef = collection(db, "influencers");

async function loadData(loadMore = false) {
    if (isLoading) return;
    isLoading = true;

    if (!loadMore) {
        influencers = [];
        lastVisible = null;
    }

    try {
        let q;
        const queryConstraints = [
            orderBy(sortColumn, sortDirection),
            limit(25)
        ];

        if (searchTerm) {
            queryConstraints.unshift(where('nome', '>=', searchTerm), where('nome', '<=', searchTerm + '\uf8ff'));
        }

        if (loadMore && lastVisible) {
            queryConstraints.push(startAfter(lastVisible));
        }

        q = query(influencersCollectionRef, ...queryConstraints);

        const data = await getDocs(q);
        lastVisible = data.docs[data.docs.length - 1];

        const newInfluencers = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        influencers = loadMore ? [...influencers, ...newInfluencers] : newInfluencers;

        renderPage(loadMore);
    } catch (error) {
        console.error("Erro ao carregar dados do Firestore:", error);
        document.getElementById('app-content').innerHTML = `<div>Erro ao carregar dados.</div>`;
    } finally {
        isLoading = false;
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

function renderPage(append = false) {
    const user = auth.currentUser;

    if (!append) {
        const content = `
            <div class="max-w-7xl mx-auto p-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 class="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                            Gestão de Influenciadores
                        </h1>
                        <p class="text-slate-400">Gerencie suas parcerias e campanhas</p>
                    </div>
                    <div class="flex gap-3 flex-wrap">
                        <button id="add-influencer-btn" class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-md">
                            <i data-lucide="plus" class="w-4 h-4"></i> Novo Influenciador
                        </button>
                    </div>
                </div>
                <div id="stats-container"></div>
                <div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700 mb-6 rounded-lg p-6">
                    <div class="relative">
                        <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4"></i>
                        <input id="search-input" type="text" placeholder="Buscar por nome..." class="w-full pl-10 pr-4 py-2 bg-slate-900/50 border-slate-600 text-slate-200 placeholder-slate-400 rounded-md">
                    </div>
                </div>
                <div id="table-container"></div>
                 <div id="load-more-container" class="text-center mt-6"></div>
            </div>
            <div id="modal-container" class="hidden"></div>
        `;
        document.getElementById('app-content').innerHTML = content;
        renderLayout(user, document.getElementById('app-content').innerHTML);
        renderStats();
    }

    renderTable(append);
    attachEventListeners();
    lucide.createIcons();
}

function renderStats() {
    const stats = {
        total: '...',
        ativos: '...',
        conversoes: influencers.reduce((sum, inf) => sum + (inf.conversoes || 0), 0),
        investimento: influencers.reduce((sum, inf) => sum + (inf.valor || 0), 0)
    };

    const container = document.getElementById('stats-container');
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6"><div class="text-sm text-slate-300">Conversões na Página</div><div class="text-2xl font-bold text-purple-400">${stats.conversoes}</div></div>
            <div class="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-6"><div class="text-sm text-slate-300">Investimento na Página</div><div class="text-2xl font-bold text-orange-400">R$ ${stats.investimento.toLocaleString('pt-BR')}</div></div>
        </div>
    `;
}

function renderTable(append = false) {
    const container = document.getElementById('table-container');
    const tableBody = container.querySelector('tbody');

    const statusColors = {
        'prospeccao': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'nao-fechou': 'bg-red-500/20 text-red-400 border-red-500/30',
        'negociacao': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'ativo': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'pausado': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };

    const influencersHTML = influencers.map(inf => `
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
    `).join('');

    if (append && tableBody) {
        tableBody.innerHTML += influencersHTML;
    } else {
        container.innerHTML = `
            <div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-lg overflow-x-auto">
                <table class="w-full text-sm text-left text-slate-300">
                    <thead class="text-xs text-slate-400 uppercase bg-slate-700/50">
                        <tr>
                            <th scope="col" class="px-6 py-3"><button class="sort-btn" data-column="nome">Nome</button></th>
                            <th scope="col" class="px-6 py-3">Instagram</th>
                            <th scope="col" class="px-6 py-3"><button class="sort-btn" data-column="seguidoresIG">Seguidores</button></th>
                            <th scope="col" class="px-6 py-3"><button class="sort-btn" data-column="status">Status</button></th>
                            <th scope="col" class="px-6 py-3"><button class="sort-btn" data-column="valor">Valor</button></th>
                             <th scope="col" class="px-6 py-3">Nicho</th>
                            <th scope="col" class="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${influencersHTML}
                    </tbody>
                </table>
            </div>
        `;
    }

    const loadMoreContainer = document.getElementById('load-more-container');
    if (lastVisible) {
         loadMoreContainer.innerHTML = `<button id="load-more-btn" class="px-4 py-2 border border-slate-600 rounded-md hover:bg-slate-800/50 text-slate-300">Carregar Mais</button>`;
    } else {
        loadMoreContainer.innerHTML = `<p class="text-slate-500">Fim dos resultados.</p>`;
    }
}

function openModal(influencer = null) {
    editingInfluencer = influencer;
    const modalContainer = document.getElementById('modal-container');
    modalContainer.classList.remove('hidden');
}

function closeModal() {
    editingInfluencer = null;
    const modalContainer = document.getElementById('modal-container');
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML = '';
}

function attachEventListeners() {
    const searchInput = document.getElementById('search-input');
    let debounceTimer;
    searchInput.addEventListener('keyup', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchTerm = e.target.value;
            loadData();
        }, 500);
    });

    document.getElementById('add-influencer-btn')?.addEventListener('click', () => openModal());
    document.getElementById('load-more-btn')?.addEventListener('click', () => loadData(true));
    
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
    const appContent = document.createElement('div');
    appContent.id = 'app-content';
    document.getElementById('app').appendChild(appContent);
    
    onAuthStateChanged(auth, (user) => {
        if(user) {
            loadData();
        }
    });
}); 