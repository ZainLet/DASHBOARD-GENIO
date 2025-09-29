import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    orderBy,
    query,
    where,
    limit,
    startAfter,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { renderLayout } from './shared.js';

let influencers = [];
let sortColumn = 'nome';
let sortDirection = 'asc';
let searchTerm = '';
let editingInfluencer = null;
let lastVisible = null;
let isLoading = false;
let user = null;
let calendar;

const influencersCollectionRef = collection(db, "influencers");
const followUpsCollectionRef = collection(db, "follow_ups");

async function loadData(loadMore = false) {
    if (isLoading) return;
    isLoading = true;

    if (!loadMore) {
        influencers = [];
        lastVisible = null;
    }

    try {
        const queryConstraints = [
            where("status", "in", ["ativo", "negociacao", "prospeccao", "pausado", "nao-fechou"]), // Filtra para não mostrar arquivados
            orderBy("status"),
            orderBy(sortColumn, sortDirection),
            limit(25)
        ];

        if (searchTerm) {
            queryConstraints.unshift(where('nome', '>=', searchTerm), where('nome', '<=', searchTerm + '\uf8ff'));
        }

        if (loadMore && lastVisible) {
            queryConstraints.push(startAfter(lastVisible));
        }

        const q = query(influencersCollectionRef, ...queryConstraints);

        const data = await getDocs(q);
        lastVisible = data.docs.length > 0 ? data.docs[data.docs.length - 1] : null;

        const newInfluencers = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        influencers = loadMore ? [...influencers, ...newInfluencers] : newInfluencers;

        renderPage(loadMore);
    } catch (error) {
        console.error("Erro ao carregar dados do Firestore:", error);
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = `<div>Erro ao carregar dados. Verifique o console para mais detalhes.</div>`;
        }
    } finally {
        isLoading = false;
    }
}

async function handleSaveInfluencer(influencerData) {
    if (!editingInfluencer) {
        const instagramHandle = influencerData.instagram.startsWith('@') ? influencerData.instagram : `@${influencerData.instagram}`;
        const q = query(influencersCollectionRef, where("instagram", "==", instagramHandle));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            alert("Erro: Já existe um influenciador cadastrado com este @usuario do Instagram.");
            return;
        }
    }

    try {
        if (editingInfluencer) {
            const influencerDoc = doc(db, "influencers", editingInfluencer.id);
            await updateDoc(influencerDoc, influencerData);
        } else {
            influencerData.status = influencerData.status || 'prospeccao';
            influencerData.postagens = []; // Garante que o campo de postagens exista
            await addDoc(influencersCollectionRef, influencerData);
        }
        closeModal();
        await loadData(false); // Recarrega a lista do zero
    } catch (error) {
        console.error("Erro ao salvar influenciador:", error);
        alert("Ocorreu um erro ao salvar. Tente novamente.");
    }
}

async function handleDeleteInfluencer(influencerId) {
    if (window.confirm("Tem certeza que deseja arquivar este influenciador? Ele será ocultado da lista, mas não será excluído permanentemente.")) {
        try {
            const influencerDoc = doc(db, "influencers", influencerId);
            await updateDoc(influencerDoc, { status: "arquivado" });
            await loadData(false); // Recarrega a lista do zero
        } catch (error) {
            console.error("Erro ao arquivar influenciador:", error);
            alert("Ocorreu um erro ao arquivar.");
        }
    }
}

function renderPage(append = false) {
    if (!append) {
        const content = `
            <div class="max-w-7xl mx-auto p-6 text-white animated fade-in">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-100">Gestão de Influenciadores</h1>
                        <p class="text-gray-400 mt-1">Gerencie suas parcerias e campanhas</p>
                    </div>
                    <div class="flex gap-3 flex-wrap">
                        <button id="add-influencer-btn" class="flex items-center gap-2 px-4 py-2 bg-green-500 hover:opacity-90 text-white rounded-md font-semibold">
                            <i data-lucide="plus" class="w-4 h-4"></i> Novo Influenciador
                        </button>
                        <button id="calendar-btn" class="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:opacity-90 text-white rounded-md font-semibold">
                            <i data-lucide="calendar" class="w-4 h-4"></i> Calendário
                        </button>
                    </div>
                </div>
                <div id="stats-container"></div>
                <div class="bg-gray-800 rounded-lg p-4 mb-6">
                    <div class="relative">
                        <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"></i>
                        <input id="search-input" type="text" placeholder="Buscar por nome..." class="w-full pl-10 pr-4 py-2 bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-400 rounded-md">
                    </div>
                </div>
                <div id="table-container"></div>
                <div id="load-more-container" class="text-center mt-6"></div>
            </div>
            <div id="modal-container" class="hidden"></div>
            <div id="calendar-modal-container" class="hidden fixed inset-0 bg-black/80 z-40 items-center justify-center p-4 animated fade-in">
                <div class="bg-gray-800 border border-slate-700 rounded-lg p-6 w-full max-w-4xl shadow-xl animated scale-in">
                     <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-white">Calendário de Postagens</h2>
                        <button id="close-calendar-btn" class="hover:text-red-500"><i data-lucide="x" class="w-6 h-6"></i></button>
                    </div>
                    <div id='calendar'></div>
                </div>
            </div>
        `;
        renderLayout(user, content);
        renderStats();
    }

    renderTable(append);
    attachEventListeners();
    initCalendar();
    lucide.createIcons();
}

function renderStats() {
    const stats = {
        total: influencers.length,
        ativos: influencers.filter(inf => inf.status === 'ativo').length,
        conversoes: influencers.reduce((sum, inf) => (sum + (inf.conversoes || 0)), 0),
        investimento: influencers.reduce((sum, inf) => (sum + (inf.valor || 0)), 0)
    };

    const container = document.getElementById('stats-container');
    if (container) {
        container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-gray-800 rounded-lg p-5"><div class="text-sm text-gray-400">Total na Lista</div><div class="text-2xl font-bold">${stats.total}</div></div>
            <div class="bg-gray-800 rounded-lg p-5"><div class="text-sm text-gray-400">Ativos</div><div class="text-2xl font-bold text-green-400">${stats.ativos}</div></div>
            <div class="bg-gray-800 rounded-lg p-5"><div class="text-sm text-gray-400">Conversões</div><div class="text-2xl font-bold text-purple-400">${stats.conversoes}</div></div>
            <div class="bg-gray-800 rounded-lg p-5"><div class="text-sm text-gray-400">Investimento</div><div class="text-2xl font-bold text-orange-400">R$ ${stats.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
        </div>
    `;
    }
}

function renderTable(append = false) {
    const container = document.getElementById('table-container');
    if (!container) return;
    const tableBody = container.querySelector('tbody');

    const statusColors = {
        'prospeccao': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'nao-fechou': 'bg-red-500/20 text-red-400 border-red-500/30',
        'negociacao': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'ativo': 'bg-green-500/20 text-green-400 border-green-500/30',
        'pausado': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };

    const influencersHTML = influencers.map(inf => `
        <tr class="border-b border-gray-700 hover:bg-gray-700/30 transition-colors duration-200">
            <td class="px-6 py-4 font-medium text-gray-200">${inf.nome || '-'}</td>
            <td class="px-6 py-4"><a href="https://instagram.com/${(inf.instagram || '').replace('@','')}" target="_blank" class="text-blue-400 hover:underline">${inf.instagram || '-'}</a></td>
            <td class="px-6 py-4">${(inf.seguidoresIG || 0).toLocaleString('pt-BR')}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs font-medium rounded-full ${statusColors[inf.status] || ''}">${inf.status || 'sem status'}</span></td>
            <td class="px-6 py-4">R$ ${(inf.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td class="px-6 py-4">${inf.nicho || '-'}</td>
            <td class="px-6 py-4 flex items-center gap-3 text-gray-400">
                <button class="edit-btn hover:text-white" data-id="${inf.id}"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button class="delete-btn hover:text-red-500" data-id="${inf.id}"><i data-lucide="archive" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');

    if (append && tableBody) {
        tableBody.innerHTML += influencersHTML;
    } else {
        container.innerHTML = `
            <div class="bg-gray-800 rounded-lg overflow-x-auto">
                <table class="w-full text-sm text-left text-gray-300">
                    <thead class="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" class="px-6 py-3"><button class="sort-btn flex items-center gap-1" data-column="nome">Nome ${sortColumn === 'nome' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</button></th>
                            <th scope="col" class="px-6 py-3">Instagram</th>
                            <th scope="col" class="px-6 py-3"><button class="sort-btn flex items-center gap-1" data-column="seguidoresIG">Seguidores ${sortColumn === 'seguidoresIG' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</button></th>
                            <th scope="col" class="px-6 py-3"><button class="sort-btn flex items-center gap-1" data-column="status">Status ${sortColumn === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</button></th>
                            <th scope="col" class="px-6 py-3"><button class="sort-btn flex items-center gap-1" data-column="valor">Valor ${sortColumn === 'valor' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</button></th>
                             <th scope="col" class="px-6 py-3">Nicho</th>
                            <th scope="col" class="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${influencersHTML.length > 0 ? influencersHTML : '<tr><td colspan="7" class="text-center py-8 text-gray-500">Nenhum influenciador encontrado.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
        if (lastVisible) {
             loadMoreContainer.innerHTML = `<button id="load-more-btn" class="px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-700 text-gray-300">Carregar Mais</button>`;
        } else {
            loadMoreContainer.innerHTML = `<p class="text-gray-500">${influencers.length > 0 ? 'Fim dos resultados.' : ''}</p>`;
        }
    }
}

function openModal(influencer = null) {
    editingInfluencer = influencer;
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const statusOptions = ['prospeccao', 'nao-fechou', 'negociacao', 'ativo', 'pausado'];
    const parceriaOptions = ['nenhum', 'permuta', 'misto', 'pago', 'visualizacoes'];

    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto animated fade-in">
            <div class="bg-gray-800 border border-slate-700 rounded-lg p-8 w-full max-w-4xl shadow-2xl my-8 relative animated scale-in">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-emerald-400">${influencer ? 'Editar' : 'Novo'} Influenciador</h2>
                    <button id="cancel-btn" class="text-slate-400 hover:text-white">&times;</button>
                </div>
                
                <form id="influencer-form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Nome *</label>
                            <input required type="text" name="nome" value="${influencer?.nome || ''}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                        <div>
                            <label class="text-sm font-medium text-slate-300">Nicho</label>
                            <input type="text" name="nicho" value="${influencer?.nicho || ''}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Instagram</label>
                            <input type="text" name="instagram" placeholder="@usuario" value="${influencer?.instagram || ''}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                        <div>
                            <label class="text-sm font-medium text-slate-300">TikTok</label>
                            <input type="text" name="tiktok" placeholder="@usuario" value="${influencer?.tiktok || ''}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Seguidores IG</label>
                            <input type="number" name="seguidoresIG" value="${influencer?.seguidoresIG || 0}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                        <div>
                            <label class="text-sm font-medium text-slate-300">Engajamento IG (%)</label>
                            <input type="number" step="0.01" name="engajamentoIG" value="${influencer?.engajamentoIG || 0}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                        <div>
                            <label class="text-sm font-medium text-slate-300">Seguidores TT</label>
                            <input type="number" name="seguidoresTT" value="${influencer?.seguidoresTT || 0}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                        <div>
                            <label class="text-sm font-medium text-slate-300">Engajamento TT (%)</label>
                            <input type="number" step="0.01" name="engajamentoTT" value="${influencer?.engajamentoTT || 0}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="text-sm font-medium text-slate-300">WhatsApp</label>
                            <input type="text" name="whatsapp" value="${influencer?.whatsapp || ''}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                        <div>
                            <label class="text-sm font-medium text-slate-300">Email</label>
                            <input type="email" name="email" value="${influencer?.email || ''}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Status</label>
                            <select name="status" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                                <option value="">Selecione</option>
                                ${statusOptions.map(opt => `<option value="${opt}" ${influencer?.status === opt ? 'selected' : ''}>${opt.charAt(0).toUpperCase() + opt.slice(1)}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-slate-300">Tipo de Parceria</label>
                            <select name="tipoParceria" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                                 ${parceriaOptions.map(opt => `<option value="${opt}" ${influencer?.tipoParceria === opt ? 'selected' : ''}>${opt.charAt(0).toUpperCase() + opt.slice(1)}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-slate-300">Valor (R$)</label>
                            <input type="number" step="0.01" name="valor" value="${influencer?.valor || 0}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div>
                            <label class="flex items-center cursor-pointer">
                                <input type="checkbox" name="influenciadorPremium" class="peer sr-only" ${influencer?.influenciadorPremium ? 'checked' : ''}>
                                <div class="relative w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                <span class="ml-3 text-sm font-medium text-slate-300">Influenciador Premium</span>
                            </label>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-slate-300">Última Postagem</label>
                            <input type="date" name="ultimaPostagem" value="${influencer?.ultimaPostagem || ''}" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">
                        </div>
                    </div>
                    
                    <div>
                        <label class="text-sm font-medium text-slate-300">Observações</label>
                        <textarea name="observacoes" rows="4" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-white">${influencer?.observacoes || ''}</textarea>
                    </div>

                    <div class="flex justify-end gap-4 pt-4">
                        <button type="button" id="form-close-btn" class="px-6 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-700">Cancelar</button>
                        <button type="submit" class="px-6 py-2 bg-green-500 text-white rounded font-semibold hover:opacity-90">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    modalContainer.classList.remove('hidden');

    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('form-close-btn').addEventListener('click', closeModal);
    document.getElementById('influencer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const influencerData = Object.fromEntries(formData.entries());
        
        influencerData.seguidoresIG = parseInt(influencerData.seguidoresIG, 10) || 0;
        influencerData.valor = parseFloat(influencerData.valor) || 0;
        influencerData.seguidoresTT = parseInt(influencerData.seguidoresTT, 10) || 0;
        influencerData.engajamentoIG = parseFloat(influencerData.engajamentoIG) || 0;
        influencerData.engajamentoTT = parseFloat(influencerData.engajamentoTT) || 0;
        influencerData.influenciadorPremium = formData.has('influenciadorPremium');
        
        handleSaveInfluencer(influencerData);
    });
}

function closeModal() {
    editingInfluencer = null;
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.classList.add('hidden');
        modalContainer.innerHTML = '';
    }
}

function openAddPostModal(date) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const activeInfluencers = influencers.filter(inf => inf.status === 'ativo');
    if (activeInfluencers.length === 0) {
        alert("Nenhum influenciador ativo para agendar postagens.");
        return;
    }

    const options = activeInfluencers.map(inf => `<option value="${inf.id}">${inf.nome}</option>`).join('');

    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animated fade-in">
            <div class="bg-gray-800 rounded-lg p-8 w-full max-w-lg animated scale-in">
                <h2 class="text-xl font-bold text-white mb-6">Agendar Postagem para ${new Date(date + 'T12:00:00').toLocaleDateString()}</h2>
                <form id="add-post-form">
                    <input type="hidden" name="date" value="${date}">
                    <div class="space-y-4">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Influenciador *</label>
                            <select name="influencerId" required class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600">${options}</select>
                        </div>
                         <div>
                            <label class="text-sm font-medium text-slate-300">Tipo de Postagem</label>
                            <input name="tipo" type="text" placeholder="Ex: Story, Post Reels" required class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600">
                        </div>
                    </div>
                    <div class="flex justify-end gap-4 mt-8">
                        <button type="button" id="cancel-post-btn" class="px-6 py-2 border border-slate-600 rounded text-slate-300">Cancelar</button>
                        <button type="submit" class="px-6 py-2 bg-purple-500 text-white rounded font-semibold">Agendar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    modalContainer.classList.remove('hidden');

    document.getElementById('cancel-post-btn').addEventListener('click', closeModal);
    document.getElementById('add-post-form').addEventListener('submit', handleAddPostSubmit);
}

async function handleAddPostSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const postData = Object.fromEntries(formData.entries());

    const influencerId = postData.influencerId;
    const influencerDocRef = doc(db, "influencers", influencerId);

    try {
        const docSnap = await getDoc(influencerDocRef);
        if (!docSnap.exists()) {
            alert("Erro: Influenciador não encontrado.");
            return;
        }

        const influencer = docSnap.data();
        const newPost = {
            id: `post_${Date.now()}`,
            date: postData.date,
            tipo: postData.tipo
        };
        
        const updatedPostagens = [...(influencer.postagens || []), newPost];
        
        await updateDoc(influencerDocRef, {
            postagens: updatedPostagens,
            ultimaPostagem: postData.date
        });
        
        const localInfluencer = influencers.find(inf => inf.id === influencerId);
        if (localInfluencer) {
            localInfluencer.postagens = updatedPostagens;
            localInfluencer.ultimaPostagem = postData.date;
        }

        closeModal();
        refreshCalendar();
        alert("Postagem agendada com sucesso!");
    } catch (error) {
        console.error("Erro ao agendar postagem:", error);
        alert("Não foi possível agendar a postagem.");
    }
}

function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    if (calendar) {
        calendar.destroy();
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        events: getCalendarEvents(),
        dateClick: (info) => openAddPostModal(info.dateStr),
        eventClick: (info) => {
            alert(`Postagem de ${info.event.title}\nData: ${info.event.start.toLocaleDateString()}`);
        },
        buttonText: { today: 'Hoje', month: 'Mês', week: 'Semana', list: 'Lista' },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        }
    });
}

function getCalendarEvents() {
    const events = [];
    influencers.forEach(inf => {
        (inf.postagens || []).forEach(post => {
            events.push({
                title: inf.nome,
                start: post.date,
                allDay: true,
                color: '#8B5CF6',
                extendedProps: { postId: post.id, influencerId: inf.id }
            });
        });
    });
    return events;
}

function refreshCalendar() {
    if (calendar) {
        calendar.removeAllEvents();
        calendar.addEventSource(getCalendarEvents());
    }
}

function openCalendarModal() {
    const calendarModal = document.getElementById('calendar-modal-container');
    if (!calendarModal) return;
    calendarModal.classList.remove('hidden');
    calendarModal.classList.add('flex');
    setTimeout(() => {
        if (calendar) {
            calendar.render();
        }
    }, 10);
}

function closeCalendarModal() {
    const calendarModal = document.getElementById('calendar-modal-container');
    if(calendarModal) {
        calendarModal.classList.add('hidden');
        calendarModal.classList.remove('flex');
    }
}

function attachEventListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchTerm = e.target.value.trim();
                loadData();
            }, 500);
        });
    }

    document.getElementById('add-influencer-btn')?.addEventListener('click', () => openModal());
    document.getElementById('calendar-btn')?.addEventListener('click', openCalendarModal);
    document.getElementById('close-calendar-btn')?.addEventListener('click', closeCalendarModal);
    
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('#load-more-btn')) {
            loadData(true);
        }
    });
    
    document.querySelector('#table-container')?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const id = editBtn.dataset.id;
            const influencer = influencers.find(inf => inf.id === id);
            openModal(influencer);
            return;
        }

        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            handleDeleteInfluencer(deleteBtn.dataset.id);
            return;
        }

        const sortBtn = e.target.closest('.sort-btn');
        if(sortBtn) {
            const column = sortBtn.dataset.column;
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }
            loadData();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (currentUser) => {
        if(currentUser) {
            user = currentUser;
            loadData();
        }
    });
});