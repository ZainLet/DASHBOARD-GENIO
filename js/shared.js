import { handleLogout } from './auth.js';

export function createPageUrl(pageName) {
    if (pageName === 'index') {
        return '/index.html';
    }
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
        <aside class="sidebar fixed inset-y-0 left-0 z-30 flex-col h-screen bg-gray-800 border-r border-gray-700 w-64 text-white transition-transform duration-300 transform -translate-x-full md:relative md:translate-x-0 md:flex">
            <div class="sidebar-header border-b border-gray-700 p-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span class="text-gray-900 font-bold text-lg">G</span>
                    </div>
                    <div>
                        <h2 class="font-bold text-xl text-gray-100">
                            Gênio IA
                        </h2>
                        <p class="text-xs text-gray-400">Sistema de Gestão</p>
                    </div>
                </div>
            </div>
            
            <nav class="flex-1 p-3">
                <div class="space-y-1">
                    ${navigationItems.map(item => `
                        <a href="${item.url}" class="flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-300 ${currentPage === item.url || (currentPage === '/' && item.url.includes('index')) ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}">
                            <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                            <span class="font-medium">${item.title}</span>
                        </a>
                    `).join('')}
                </div>
            </nav>

            <div class="sidebar-footer border-t border-gray-700 p-4">
                <div class="space-y-3">
                    <div class="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl">
                        <div class="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span class="text-gray-900 font-medium text-sm">
                                ${user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-200 text-sm truncate">${user.displayName || 'Usuário'}</p>
                            <p class="text-xs text-gray-400 truncate">${user.email}</p>
                        </div>
                    </div>
                    
                    <button id="logout-button" class="w-full flex items-center justify-center p-2 border border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-200 rounded-md">
                        <i data-lucide="log-out" class="w-4 h-4 mr-2"></i>
                        Sair
                    </button>
                </div>
            </div>
        </aside>
        <div id="sidebar-overlay" class="fixed inset-0 bg-black/60 z-20 hidden md:hidden"></div>
        <main class="flex-1 flex flex-col md:w-[calc(100%-16rem)]">
            <header class="bg-gray-800 border-b border-gray-700 px-6 py-4 md:hidden">
                 <div class="flex items-center justify-between">
                    <h1 class="text-xl font-semibold text-gray-200">Gênio IA</h1>
                    <button id="sidebar-trigger" class="hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200 text-gray-300">
                        <i data-lucide="menu"></i>
                    </button>
                 </div>
            </header>
            <div class="flex-1 overflow-auto" id="app-content">
                </div>
        </main>
    `;

    appContainer.innerHTML = layoutHTML;

    const appContentContainer = document.getElementById('app-content');
    if (appContentContainer) {
        appContentContainer.innerHTML = pageContent;
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