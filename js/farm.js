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
    const pageContent = `
        <div class="max-w-7xl mx-auto p-6">
            <div class="mb-8">
                <h1 class="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    Farm de Perfis
                </h1>
                <p class="text-slate-400">Gerencie perfis e automatize comentários</p>
            </div>
            
            <div id="tabs-container">
                <div class="grid w-full grid-cols-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-md">
                    <button data-tab="profiles" class="tab-btn flex items-center justify-center gap-2 p-2 rounded-md">
                        <i data-lucide="bot" class="w-4 h-4"></i> Perfis
                    </button>
                    <button data-tab="ads" class="tab-btn flex items-center justify-center gap-2 p-2 rounded-md">
                        <i data-lucide="target" class="w-4 h-4"></i> Anúncios
                    </button>
                    <button data-tab="history" class="tab-btn flex items-center justify-center gap-2 p-2 rounded-md">
                        <i data-lucide="history" class="w-4 h-4"></i> Histórico
                    </button>
                    <button data-tab="workspace" class="tab-btn flex items-center justify-center gap-2 p-2 rounded-md">
                        <i data-lucide="play" class="w-4 h-4"></i> Área de Trabalho
                    </button>
                </div>

                <div id="tab-content" class="mt-6">
                    ${loading ? '<div>Carregando...</div>' : renderTabContent()}
                </div>
            </div>
        </div>
    `;

    document.getElementById('app').innerHTML = pageContent;
    renderLayout(user, document.getElementById('app').innerHTML);
    
    updateActiveTab();
    attachTabEventListeners();
    lucide.createIcons();
}

function updateActiveTab() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active-tab');
        if (btn.dataset.tab === currentTab) {
            btn.classList.add('active-tab');
        }
    });
}

function renderTabContent() {
    switch (currentTab) {
        case 'profiles':
            return renderProfilesTab();
        case 'ads':
            return renderAdsTab();
        case 'history':
            return renderHistoryTab();
        case 'workspace':
            return renderWorkspaceTab();
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
                </div>
            <div class="bg-slate-800/50 p-6 rounded-lg">
                </div>
            <div class="bg-slate-800/50 p-0 rounded-lg overflow-x-auto">
                <table class="w-full">
                    <tbody>
                        ${profiles.map(profile => `<tr></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

function renderAdsTab() {
    return `<div class="space-y-6">Ads content here</div>`;
}

function renderHistoryTab() {
    return `<div class="space-y-6">History content here</div>`;
}

function renderWorkspaceTab() {
    return `<div class="space-y-6">Workspace content here</div>`;
}

function attachTabEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTab = btn.dataset.tab;
            document.getElementById('tab-content').innerHTML = renderTabContent();
            updateActiveTab();
            lucide.createIcons();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.createElement('div');
    appContent.id = 'app-content';
    document.getElementById('app').innerHTML = '<div id="app-content"></div>';

    onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            user = currentUser;
            loadData();
        }
    });
});