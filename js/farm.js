import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
    collection,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { renderLayout } from './shared.js';

// State variables
let profiles = [];
let ads = [];
let comments = [];
let user = null;
let currentTab = 'profiles';
let loading = true;

// Firestore references
const profilesCollectionRef = collection(db, "farm_profiles");
const adsCollectionRef = collection(db, "farm_ads");
const commentsCollectionRef = collection(db, "farm_comments");

// --- DATA FUNCTIONS ---
async function loadData() {
    loading = true;
    renderPage(); // Renderiza a página com o estado de "Carregando"
    try {
        const [profilesSnapshot, adsSnapshot, commentsSnapshot] = await Promise.all([
            getDocs(profilesCollectionRef),
            getDocs(adsCollectionRef),
            getDocs(commentsCollectionRef)
        ]);

        profiles = profilesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        ads = adsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        comments = commentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

        loading = false;
        renderPage(); // Re-renderiza a página com os dados carregados
    } catch (error) {
        console.error("Erro ao carregar dados do Farm:", error);
        document.getElementById('app-content').innerHTML = `<div>Erro ao carregar dados.</div>`;
    }
}

// --- RENDER FUNCTIONS ---
function renderPage() {
    const pageContent = `
        <div class="max-w-7xl mx-auto p-6 animated fade-in">
            <div class="mb-10">
                <h1 class="text-3xl font-bold text-gray-100">Farm de Perfis</h1>
                <p class="text-gray-400 mt-1">Gerencie perfis e automatize comentários</p>
            </div>
            
            <div id="tabs-container">
                <div class="flex space-x-1 bg-gray-800 rounded-lg p-1">
                    <button data-tab="profiles" class="tab-btn flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors duration-200"><i data-lucide="bot" class="w-4 h-4"></i> Perfis</button>
                    <button data-tab="ads" class="tab-btn flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors duration-200"><i data-lucide="target" class="w-4 h-4"></i> Anúncios</button>
                    <button data-tab="history" class="tab-btn flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors duration-200"><i data-lucide="history" class="w-4 h-4"></i> Histórico</button>
                    <button data-tab="workspace" class="tab-btn flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors duration-200"><i data-lucide="play" class="w-4 h-4"></i> Área de Trabalho</button>
                </div>

                <div id="tab-content" class="mt-6">
                    ${loading ? '<div class="text-center text-gray-400">Carregando...</div>' : renderTabContent()}
                </div>
            </div>
        </div>
    `;
    
    // A função renderLayout agora cuida de toda a estrutura da página
    renderLayout(user, pageContent);
    
    // As funções abaixo são chamadas depois que o layout e o conteúdo estão no lugar
    updateActiveTab();
    attachTabEventListeners();
    lucide.createIcons();
}


function updateActiveTab() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active-tab', 'bg-gray-700', 'text-white');
        btn.classList.add('text-gray-400', 'hover:bg-gray-700/50');
        if (btn.dataset.tab === currentTab) {
            btn.classList.add('active-tab', 'bg-gray-700', 'text-white');
            btn.classList.remove('text-gray-400');
        }
    });
}

function renderTabContent() {
    switch (currentTab) {
        case 'profiles':
            return renderProfilesTab();
        case 'ads':
            return '<div class="text-center text-gray-500">Seção de Anúncios em desenvolvimento.</div>';
        case 'history':
            return '<div class="text-center text-gray-500">Seção de Histórico em desenvolvimento.</div>';
        case 'workspace':
            return '<div class="text-center text-gray-500">Seção de Área de Trabalho em desenvolvimento.</div>';
        default:
            return '';
    }
}

function renderProfilesTab() {
    const stats = {
        total: profiles.length,
        ativos: profiles.filter(p => p.status === 'ativo').length,
        banidos: profiles.filter(p => p.status === 'banido').length,
        comentariosHoje: profiles.reduce((sum, p) => sum + (p.comentariosHoje || 0), 0)
    };

    return `
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-gray-800 p-4 rounded-lg animated slide-in-up stagger-1"><div class="text-sm text-gray-400">Total</div><div class="text-2xl font-bold">${stats.total}</div></div>
                <div class="bg-gray-800 p-4 rounded-lg animated slide-in-up stagger-2"><div class="text-sm text-gray-400">Ativos</div><div class="text-2xl font-bold text-green-400">${stats.ativos}</div></div>
                <div class="bg-gray-800 p-4 rounded-lg animated slide-in-up stagger-3"><div class="text-sm text-gray-400">Banidos</div><div class="text-2xl font-bold text-red-400">${stats.banidos}</div></div>
                <div class="bg-gray-800 p-4 rounded-lg animated slide-in-up stagger-4"><div class="text-sm text-gray-400">Comentários Hoje</div><div class="text-2xl font-bold">${stats.comentariosHoje}</div></div>
            </div>
            <div class="bg-gray-800 p-6 rounded-lg animated slide-in-up">
                <h3 class="font-bold text-lg mb-4">Adicionar Novo Perfil</h3>
                </div>
            <div class="bg-gray-800 rounded-lg overflow-x-auto animated slide-in-up">
                <table class="w-full text-sm">
                    <thead class="bg-gray-700/50 text-xs text-gray-400 uppercase">
                        <tr>
                            <th class="p-3 text-left">Nome</th>
                            <th class="p-3 text-left">Status</th>
                            <th class="p-3 text-left">Comentários Hoje</th>
                            <th class="p-3 text-left">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="text-gray-300">
                        ${profiles.map(profile => `
                            <tr class="border-b border-gray-700 hover:bg-gray-700/30">
                                <td class="p-3">${profile.nome || '-'}</td>
                                <td class="p-3">${profile.status || '-'}</td>
                                <td class="p-3">${profile.comentariosHoje || 0}</td>
                                <td class="p-3">...</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

function attachTabEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTab = btn.dataset.tab;
            renderPage();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Apenas aguarda o onAuthStateChanged para iniciar o carregamento
    onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            user = currentUser;
            loadData();
        }
    });
});