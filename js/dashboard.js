import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { collection, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { renderLayout, createPageUrl } from './shared.js';

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
        
        const negociacaoQuery = query(collection(db, "follow_ups"), where("status", "==", "negociacao"));
        const negociacaoSnap = await getDocs(negociacaoQuery);

        const farmProfilesQuery = query(collection(db, "farm_profiles"));
        const farmProfilesSnap = await getDocs(farmProfilesQuery);

        const progressSnap = await getDocs(collection(db, "assistant_progress"));
        let metasConcluidas = 0;
        let totalMetas = 0;
        if (!progressSnap.empty) {
            const progress = progressSnap.docs[0].data();
            totalMetas = Object.keys(progress.checklist || {}).length;
            metasConcluidas = Object.values(progress.checklist || {}).filter(Boolean).length;
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
            influencersDesdeOntem: 2, 
            comentariosHoje: commentsSnap.size,
            comentariosMeta: 150, 
            metasConcluidas: metasConcluidas,
            totalMetas: totalMetas,
            proximasPostagens: postagensSnap.size,
            emNegociacao: negociacaoSnap.size,
            perfisFarm: farmProfilesSnap.size,
        };

    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
        return {
            influencersAtivos: 0, influencersDesdeOntem: 0,
            comentariosHoje: 0, comentariosMeta: 0,
            metasConcluidas: 0, totalMetas: 0,
            proximasPostagens: 0, emNegociacao: 0, perfisFarm: 0,
        };
    }
}

function getDashboardContent(user, stats, currentTime) {
    const metasPercentual = stats.totalMetas > 0 ? Math.round((stats.metasConcluidas / stats.totalMetas) * 100) : 0;

    const statCards = [
        { title: "Influenciadores Ativos", value: stats.influencersAtivos, subtitle: `+${stats.influencersDesdeOntem} desde ontem`, icon: "trending-up", color: "text-green-400" },
        { title: "Comentários Hoje", value: stats.comentariosHoje, subtitle: `Meta: ${stats.comentariosMeta}/dia`, icon: "activity", color: "text-blue-400" },
        { title: "Metas Concluídas", value: `${metasPercentual}%`, subtitle: `${stats.metasConcluidas} de ${stats.totalMetas} metas`, icon: "bar-chart-3", color: "text-purple-400" },
        { title: "Próximas Postagens", value: stats.proximasPostagens, subtitle: `Nos próximos 7 dias`, icon: "calendar", color: "text-orange-400" }
    ];
    
    const navigationCards = [
      {
        title: "Gestão de Influenciadores",
        description: "CRM completo para parcerias",
        icon: "users",
        url: createPageUrl("influencers"),
        color: "green",
        topStat: `${stats.influencersAtivos} Ativos`
      },
      {
        title: "CRM Pipeline",
        description: "Follow-ups e negociações",
        icon: "git-branch",
        url: createPageUrl("crm"),
        color: "purple",
        topStat: `${stats.emNegociacao} Em negociação`
      },
      {
        title: "Farm de Perfis",
        description: "Gestão de perfis para comentários",
        icon: "bot",
        url: createPageUrl("farm"),
        color: "blue",
        topStat: `${stats.perfisFarm} Perfis`
      },
      {
        title: "Rotina & Metas",
        description: "Dashboard de produtividade",
        icon: "target",
        url: createPageUrl("assistant"),
        color: "pink",
        topStat: `${metasPercentual}% Hoje`
      },
      {
        title: "Ponto",
        description: "Sistema de ponto externo",
        icon: "external-link",
        url: "https://genioponto.netlify.app/",
        color: "orange",
        external: true,
        topStat: "Externo"
      }
    ];

    const cardColors = {
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        blue: 'bg-blue-500',
        pink: 'bg-pink-500',
        orange: 'bg-orange-500',
    }

    return `
        <div class="max-w-7xl mx-auto p-6 text-white">
            <div class="mb-10 animated slide-in-up">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 class="text-3xl font-bold">
                           <span class="text-gray-300">${getGreeting(currentTime)},</span>
                           <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">${user?.displayName || 'Usuário'}!</span>
                        </h1>
                        <p class="text-gray-400 mt-1">
                            Bem-vindo ao seu centro de comando
                        </p>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-semibold text-gray-200 clock-time">
                            ${currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div class="text-gray-400 text-sm clock-date">
                            ${currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                ${statCards.map((stat, index) => `
                    <div class="bg-gray-800 rounded-lg p-5 animated slide-in-up stagger-${index + 1}">
                        <div class="flex justify-between items-start">
                            <h3 class="text-sm font-medium text-gray-400">${stat.title}</h3>
                            <i data-lucide="${stat.icon}" class="h-5 w-5 ${stat.color}"></i>
                        </div>
                        <div class="mt-2">
                            <div class="text-3xl font-bold text-gray-100">${stat.value}</div>
                            <p class="text-xs text-gray-500">${stat.subtitle}</p>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                ${navigationCards.map((card, index) => `
                    <div class="bg-gray-800 rounded-lg p-5 flex flex-col justify-between animated slide-in-up stagger-${index + 1}">
                        <div>
                            <div class="flex items-center gap-2 mb-4">
                                <i data-lucide="${card.icon}" class="w-4 h-4 text-gray-400"></i>
                                <span class="text-xs text-gray-400">${card.topStat}</span>
                            </div>
                            <h3 class="text-lg font-bold text-gray-100 mb-1">${card.title}</h3>
                            <p class="text-gray-400 text-sm mb-6">${card.description}</p>
                        </div>
                        <a href="${card.url}" ${card.external ? 'target="_blank" rel="noopener noreferrer"' : ''} class="block w-full">
                            <button class="w-full ${cardColors[card.color]} text-white font-semibold transition-opacity duration-300 hover:opacity-90 p-2 rounded-md flex items-center justify-center text-sm">
                                Acessar ${card.external ? '<i data-lucide="arrow-up-right" class="w-4 h-4 ml-1"></i>' : ''}
                            </button>
                        </a>
                    </div>
                `).join('')}
            </div>
            
            <div class="mt-12 text-center animated fade-in stagger-4">
                <p class="text-gray-600 text-sm">Gênio IA © ${new Date().getFullYear()} - Sistema de Gestão Inteligente</p>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    let user = null;
    let loading = true;
    let currentTime = new Date();
    
    const app = document.getElementById('app');
    if(app) {
        app.innerHTML = '<div id="app-content"></div>';
    }

    onAuthStateChanged(auth, async (currentUser) => {
        user = currentUser;
        if (currentUser) {
            const stats = await fetchStats();
            loading = false;
            const dashboardContent = getDashboardContent(user, stats, currentTime);
            document.getElementById('app-content').innerHTML = dashboardContent;
            renderLayout(user, document.getElementById('app-content').innerHTML);
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