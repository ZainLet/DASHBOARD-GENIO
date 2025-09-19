import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { collection, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { renderLayout, createPageUrl } from './shared.js';

const navigationCards = [
  {
    title: "Gestão de Influenciadores",
    description: "CRM completo para parcerias",
    icon: "users",
    url: createPageUrl("influencers"),
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "CRM Pipeline",
    description: "Follow-ups e negociações",
    icon: "git-branch",
    url: createPageUrl("crm"),
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    title: "Farm de Perfis",
    description: "Gestão de perfis para comentários",
    icon: "bot",
    url: createPageUrl("farm"),
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    title: "Rotina & Metas",
    description: "Dashboard de produtividade",
    icon: "target",
    url: createPageUrl("assistant"),
    gradient: "from-purple-500 to-pink-600",
  },
  {
    title: "Ponto",
    description: "Sistema de ponto externo",
    icon: "external-link",
    url: "https://genioponto.netlify.app/",
    gradient: "from-orange-500 to-red-600",
    external: true
  }
];

function getGreeting(date) {
    const hour = date.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
}

async function fetchStats() {
    try {
        const influencersQuery = query(collection(db, "influencers"), where("status", "==", "ativo"));
        const influencersSnap = await getDocs(influencersQuery);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const commentsQuery = query(
            collection(db, "farm_comments"),
            where("data", ">=", Timestamp.fromDate(today)),
            where("data", "<", Timestamp.fromDate(tomorrow))
        );
        const commentsSnap = await getDocs(commentsQuery);

        const progressSnap = await getDocs(collection(db, "assistant_progress"));
        let metasConcluidas = '0%';
        if (!progressSnap.empty) {
            const progress = progressSnap.docs[0].data();
            const totalMetas = Object.keys(progress.checklist || {}).length;
            const concluidas = Object.values(progress.checklist || {}).filter(Boolean).length;
            if (totalMetas > 0) {
                metasConcluidas = `${Math.round((concluidas / totalMetas) * 100)}%`;
            }
        }

        const proximos7dias = new Date();
        proximos7dias.setDate(proximos7dias.getDate() + 7);
        const postagensQuery = query(
            collection(db, "follow_ups"),
            where("nextActionDate", ">=", Timestamp.fromDate(new Date())),
            where("nextActionDate", "<=", Timestamp.fromDate(proximos7dias))
        );
        const postagensSnap = await getDocs(postagensQuery);

        return {
            influencersAtivos: influencersSnap.size,
            comentariosHoje: commentsSnap.size,
            metasConcluidas: metasConcluidas,
            proximasPostagens: postagensSnap.size
        };

    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
        return {
            influencersAtivos: 0,
            comentariosHoje: 0,
            metasConcluidas: '0%',
            proximasPostagens: 0
        };
    }
}

function getDashboardContent(user, stats, currentTime) {
    const statCards = [
        { title: "Influenciadores Ativos", value: stats.influencersAtivos, icon: "trending-up", color: "text-emerald-400" },
        { title: "Comentários Hoje", value: stats.comentariosHoje, icon: "activity", color: "text-blue-400" },
        { title: "Metas Concluídas", value: stats.metasConcluidas, icon: "bar-chart-3", color: "text-purple-400" },
        { title: "Próximas Postagens", value: stats.proximasPostagens, icon: "calendar", color: "text-orange-400" }
    ];

    return `
        <div class="relative z-10 max-w-7xl mx-auto p-6">
            <div class="mb-12">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-3">
                            ${getGreeting(currentTime)}, ${user?.displayName || 'Usuário'}!
                        </h1>
                        <p class="text-xl text-slate-300">
                            Bem-vindo ao seu centro de comando
                        </p>
                    </div>
                    <div class="flex flex-col items-end text-right">
                        <div class="text-2xl font-bold text-slate-200 clock-time">
                            ${currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div class="text-slate-400 clock-date">
                            ${currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                ${statCards.map(stat => `
                    <div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-lg p-6">
                        <div class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 class="text-sm font-medium text-slate-400">${stat.title}</h3>
                            <i data-lucide="${stat.icon}" class="h-4 w-4 ${stat.color}"></i>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-slate-200">${stat.value}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                ${navigationCards.map(card => `
                    <div class="group relative overflow-hidden bg-slate-800/30 backdrop-blur-xl border border-slate-700 hover:border-slate-600 transition-all duration-500 hover:scale-105 hover:shadow-2xl rounded-lg">
                        <div class="absolute inset-0 bg-gradient-to-br ${card.gradient.replace('from-', 'from-').replace('to-', 'to-')} opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                        <div class="p-6 relative z-10">
                            <div class="p-3 rounded-xl bg-gradient-to-r ${card.gradient.replace('from-', 'from-').replace('to-', 'to-')} shadow-lg w-fit mb-4">
                                <i data-lucide="${card.icon}" class="w-6 h-6 text-white"></i>
                            </div>
                            <h3 class="text-xl font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">${card.title}</h3>
                            <p class="text-slate-400 text-sm mb-6 group-hover:text-slate-300 transition-colors">${card.description}</p>
                            <a href="${card.url}" ${card.external ? 'target="_blank" rel="noopener noreferrer"' : ''} class="block w-full">
                                <button class="w-full bg-gradient-to-r ${card.gradient.replace('from-', 'from-').replace('to-', 'to-')} hover:opacity-90 text-white font-semibold transition-all duration-300 hover:shadow-lg p-2 rounded-md flex items-center justify-center">
                                    Acessar ${card.external ? '<i data-lucide="external-link" class="w-4 h-4 ml-2"></i>' : ''}
                                </button>
                            </a>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="mt-12 text-center">
                <p class="text-slate-500 text-sm">Gênio IA © 2024 - Sistema de Gestão Inteligente</p>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    let user = null;
    let loading = true;
    let currentTime = new Date();
    
    onAuthStateChanged(auth, async (currentUser) => {
        user = currentUser;
        if (currentUser) {
            const stats = await fetchStats();
            loading = false;
            const dashboardContent = getDashboardContent(user, stats, currentTime);
            renderLayout(user, dashboardContent);
            lucide.createIcons();
        } else {
            loading = false;
        }
    });

    setInterval(() => {
        currentTime = new Date();
        if(user && !loading) {
            const timeEl = document.querySelector('.clock-time');
            const dateEl = document.querySelector('.clock-date');
            if (timeEl) timeEl.textContent = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            if (dateEl) dateEl.textContent = currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
        }
    }, 1000);
});