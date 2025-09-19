import { handleLogout } from './auth.js';

export function createPageUrl(pageName) {
    return `/${pageName.toLowerCase()}.html`;
}

const navigationItems = [
    {
        title: "Dashboard",
        url: createPageUrl("index"),
        icon: 'layout-dashboard',
    },
    {
        title: "Influenciadores",
        url: createPageUrl("influencers"),
        icon: 'users',
    },
    {
        title: "CRM Pipeline",
        url: createPageUrl("crm"),
        icon: 'git-branch',
    },
    {
        title: "Farm de Perfis",
        url: createPageUrl("farm"),
        icon: 'bot',
    },
    {
        title: "Rotina & Metas",
        url: createPageUrl("assistant"),
        icon: 'target',
    }
];

export function renderLayout(user, pageContent) {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    const currentPage = window.location.pathname;

    const layoutHTML = `
        <aside class="sidebar flex flex-col h-screen bg-slate-900/90 backdrop-blur-xl border-r border-slate-700 w-64 text-white">
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
        <main class="flex-1 flex flex-col">
            <header class="bg-slate-900/40 backdrop-blur-xl border-b border-slate-700 px-6 py-4 md:hidden">
                 <div class="flex items-center gap-4">
                    <button id="sidebar-trigger" class="hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200 text-slate-300">
                        <i data-lucide="menu"></i>
                    </button>
                    <h1 class="text-xl font-semibold text-slate-200">Gênio IA</h1>
                 </div>
            </header>
            <div class="flex-1 overflow-auto">
                ${pageContent}
            </div>
        </main>
    `;
    appContainer.innerHTML = layoutHTML;

    // Adiciona o event listener para o botão de logout
    document.getElementById('logout-button').addEventListener('click', handleLogout);

    // Adiciona funcionalidade para o menu hamburguer (opcional)
    const sidebar = appContainer.querySelector('.sidebar');
    const trigger = document.getElementById('sidebar-trigger');
    if (trigger) {
        trigger.addEventListener('click', () => {
            sidebar.classList.toggle('hidden'); // Simples toggle para mobile
        });
    }

    lucide.createIcons();
}