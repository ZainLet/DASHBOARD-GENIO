// Local: zainlet/dashboard-genio/ZainLet-DASHBOARD-GENIO-649c1ce7de1ce2fd13755098a68c4310cbe9ea3f/js/farm.js

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
    renderPage(); // Show loading state
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
        renderPage(); // Re-render with data
    } catch (error) {
        console.error("Erro ao carregar dados do Farm:", error);
        document.getElementById('app-content').innerHTML = `<div>Erro ao carregar dados.</div>`;
    }
}

// --- RENDER FUNCTIONS ---
function renderPage() {
    const appContent = document.getElementById('app-content');
    if (!appContent) return;

    const pageContent = `
        <div class="max-w-7xl mx-auto p-6">
            <div class="mb-8">
                <h1 class="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    Farm de Perfis
                </h1>
                <p class="text-slate-400">Gerencie perfis e automatize comentários</p>
            </div>
            
            <div id="tabs-container">
                <div class="flex space-x-1 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-lg p-1">
                    <button data-tab="profiles" class="tab-btn flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors duration-200"><i data-lucide="bot" class="w-4 h-4"></i> Perfis</button>
                    <button data-tab="ads" class="tab-btn flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors duration-200"><i data-lucide="target" class="w-4 h-4"></i> Anúncios</button>
                    <button data-tab="history" class="tab-btn flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors duration-200"><i data-lucide="history" class="w-4 h-4"></i> Histórico</button>
                    <button data-tab="workspace" class="tab-btn flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors duration-200"><i data-lucide="play" class="w-4 h-4"></i> Área de Trabalho</button>
                </div>

                <div id="tab-content" class="mt-6">
                    ${loading ? '<div class="text-center text-slate-400">Carregando...</div>' : renderTabContent()}
                </div>
            </div>
        </div>
    `;
    
    appContent.innerHTML = pageContent;

    if (user) {
        renderLayout(user, appContent.innerHTML);
    }
    
    updateActiveTab();
    attachTabEventListeners();
    lucide.createIcons();
}


function updateActiveTab() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active-tab', 'bg-slate-700', 'text-white');
        btn.classList.add('text-slate-400', 'hover:bg-slate-700/50');
        if (btn.dataset.tab === currentTab) {
            btn.classList.add('active-tab', 'bg-slate-700', 'text-white');
            btn.classList.remove('text-slate-400');
        }
    });
}

function renderTabContent() {
    switch (currentTab) {
        case 'profiles':
            return renderProfilesTab();
        case 'ads':
            return '<div class="text-center text-slate-500">Seção de Anúncios em desenvolvimento.</div>';
        case 'history':
            return '<div class="text-center text-slate-500">Seção de Histórico em desenvolvimento.</div>';
        case 'workspace':
            return '<div class="text-center text-slate-500">Seção de Área de Trabalho em desenvolvimento.</div>';
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
                <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700"><div class="text-sm text-slate-400">Total</div><div class="text-2xl font-bold">${stats.total}</div></div>
                <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700"><div class="text-sm text-slate-400">Ativos</div><div class="text-2xl font-bold text-emerald-400">${stats.ativos}</div></div>
                <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700"><div class="text-sm text-slate-400">Banidos</div><div class="text-2xl font-bold text-red-400">${stats.banidos}</div></div>
                <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700"><div class="text-sm text-slate-400">Comentários Hoje</div><div class="text-2xl font-bold">${stats.comentariosHoje}</div></div>
            </div>
            <div class="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h3 class="font-bold text-lg mb-4">Adicionar Novo Perfil</h3>
                </div>
            <div class="bg-slate-800/50 rounded-lg overflow-x-auto border border-slate-700">
                <table class="w-full text-sm">
                    <thead class="bg-slate-700/50">
                        <tr>
                            <th class="p-3 text-left">Nome</th>
                            <th class="p-3 text-left">Status</th>
                            <th class="p-3 text-left">Comentários Hoje</th>
                            <th class="p-3 text-left">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${profiles.map(profile => `
                            <tr class="border-b border-slate-700 hover:bg-slate-700/30">
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
            renderPage(); // Re-renderiza a página inteira para atualizar conteúdo e layout
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<div id="app-content">Carregando...</div>';
    }

    onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            user = currentUser;
            loadData();
        }
    });
});