// Local: zainlet/dashboard-genio/ZainLet-DASHBOARD-GENIO-649c1ce7de1ce2fd13755098a68c4310cbe9ea3f/js/shared.js

import { handleLogout } from './auth.js';

export function createPageUrl(pageName) {
    // Corrigido para retornar o caminho correto, incluindo 'index.html' para a raiz.
    if (pageName === 'index') {
        return '/index.html';
    }
    return `/${pageName.toLowerCase()}.html`;
}

const navigationItems = [
    {
        title: "Dashboard",
        url: createPageUrl("index"), // Corrigido
        icon: 'layout-dashboard',
    },
    {
        title: "Influenciadores",
        url: createPageUrl("influencers"), // Corrigido
        icon: 'users',
    },
    {
        title: "CRM Pipeline",
        url: createPageUrl("crm"), // Corrigido
        icon: 'git-branch',
    },
    {
        title: "Farm de Perfis",
        url: createPageUrl("farm"), // Corrigido
        icon: 'bot',
    },
    {
        title: "Rotina & Metas",
        url: createPageUrl("assistant"), // Corrigido
        icon: 'target',
    }
];

export function renderLayout(user, pageContent) {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    const currentPage = window.location.pathname;

    const layoutHTML = `
        <aside class="sidebar fixed inset-y-0 left-0 z-30 flex-col h-screen bg-slate-900/90 backdrop-blur-xl border-r border-slate-700 w-64 text-white transition-transform duration-300 transform -translate-x-full md:relative md:translate-x-0 md:flex">
            <div class="sidebar-header border-b border-slate-700 p-6 bg-slate-900/50">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                        <span class="text-slate-900 font-bold text-lg">G</span>
                    </div>
                    <div>
                        <h2 class="font-bold text-xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Gênio IA
                        </h2>
                        <p class="text-xs text-slate-400">Sistema de Gestão</p>
                    </div>
                </div>
            </div>
            
            <nav class="flex-1 p-3 bg-slate-900/30">
                <div class="space-y-1">
                    ${navigationItems.map(item => `
                        <a href="${item.url}" class="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-800/60 hover:text-emerald-400 transition-all duration-300 ${currentPage === item.url || (currentPage === '/' && item.url.includes('index')) ? 'sidebar-menu-button active' : 'text-slate-300'}">
                            <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                            <span class="font-medium">${item.title}</span>
                        </a>
                    `).join('')}
                </div>
            </nav>

            <div class="sidebar-footer border-t border-slate-700 p-4 bg-slate-900/50">
                <div class="space-y-3">
                    <div class="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl backdrop-blur-sm border border-slate-700/50">
                        <div class="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                            <span class="text-slate-900 font-medium text-sm">
                                ${user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-slate-200 text-sm truncate">${user.displayName || 'Usuário'}</p>
                            <p class="text-xs text-slate-400 truncate">${user.email}</p>
                        </div>
                    </div>
                    
                    <button id="logout-button" class="w-full flex items-center justify-center p-2 border border-slate-600 hover:bg-slate-800/60 hover:border-slate-500 text-slate-300 hover:text-slate-200 transition-all duration-200 rounded-md">
                        <i data-lucide="log-out" class="w-4 h-4 mr-2"></i>
                        Sair
                    </button>
                </div>
            </div>
        </aside>
        <div id="sidebar-overlay" class="fixed inset-0 bg-black/60 z-20 hidden md:hidden"></div>
        <main class="flex-1 flex flex-col md:w-[calc(100%-16rem)]">
            <header class="bg-slate-900/40 backdrop-blur-xl border-b border-slate-700 px-6 py-4 md:hidden">
                 <div class="flex items-center justify-between">
                    <h1 class="text-xl font-semibold text-slate-200">Gênio IA</h1>
                    <button id="sidebar-trigger" class="hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200 text-slate-300">
                        <i data-lucide="menu"></i>
                    </button>
                 </div>
            </header>
            <div class="flex-1 overflow-auto" id="app-content-wrapper">
                ${pageContent}
            </div>
        </main>
    `;
    appContainer.innerHTML = layoutHTML;

    // Renomeei o ID para evitar conflito com a div principal #app-content
    const pageWrapper = document.getElementById('app-content-wrapper');
    const appContent = document.getElementById('app-content');
    if (appContent) {
        pageWrapper.innerHTML = ''; // Limpa o wrapper
        pageWrapper.appendChild(appContent); // Move o conteúdo da página para dentro do wrapper
    }


    document.getElementById('logout-button').addEventListener('click', handleLogout);

    const sidebar = appContainer.querySelector('.sidebar');
    const trigger = document.getElementById('sidebar-trigger');
    const overlay = document.getElementById('sidebar-overlay');

    const toggleSidebar = () => {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    };

    if (trigger) {
        trigger.addEventListener('click', toggleSidebar);
    }
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }

    lucide.createIcons();
}