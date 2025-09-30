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
    getDoc,
    deleteDoc,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { renderLayout } from './shared.js';

// --- Variáveis Globais ---
let influencers = [];
let sortColumn = 'nome';
let sortDirection = 'asc';
let searchTerm = '';
let editingInfluencer = null;
let lastVisible = null;
let isLoading = false;
let user = null;
let calendar;
let activeTests = [];
let messageTemplates = [];

const influencersCollectionRef = collection(db, "influencers");
const testsCollectionRef = collection(db, "ab_tests");
const templatesCollectionRef = collection(db, "message_templates");
const followUpsCollectionRef = collection(db, "follow_ups");

// --- Funções Principais de Dados ---

async function loadData(loadMore = false) {
    if (isLoading) return;
    isLoading = true;

    if (!loadMore) {
        influencers = [];
        lastVisible = null;
    }

    try {
        const [testsSnapshot, templatesSnapshot] = await Promise.all([
            getDocs(query(testsCollectionRef, where("status", "==", "ativo"))),
            getDocs(templatesCollectionRef)
        ]);
        
        activeTests = testsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        messageTemplates = templatesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

        const queryConstraints = [
            where("status", "in", ["ativo", "negociacao", "prospeccao", "pausado", "nao-fechou"]),
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
    } finally {
        isLoading = false;
    }
}

// ATUALIZADO: Sincroniza a conversão do Teste A/B ao mudar o status para "ativo"
async function handleSaveInfluencer(influencerData, formElement) {
    const submitButton = formElement.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `<i data-lucide="refresh-cw" class="animate-spin w-4 h-4 mr-2"></i> Salvando...`;
    lucide.createIcons();

    try {
        // Lógica de Sincronização: Se o status mudou para "ativo"
        if (editingInfluencer && influencerData.status === 'ativo' && editingInfluencer.status !== 'ativo') {
            if (editingInfluencer.abTest && !editingInfluencer.abTest.converteu) {
                const { testId, variant } = editingInfluencer.abTest;
                const testDocRef = doc(db, "ab_tests", testId);
                const fieldToUpdate = variant === 'A' ? 'varianteA.conversoes' : 'varianteB.conversoes';
                
                // Incrementa a conversão no teste A/B
                await updateDoc(testDocRef, { [fieldToUpdate]: increment(1) });

                // Atualiza o objeto do influenciador para marcar a conversão
                influencerData.abTest = { ...editingInfluencer.abTest, converteu: true };
            }
        }

        if (editingInfluencer) {
            const influencerDoc = doc(db, "influencers", editingInfluencer.id);
            await updateDoc(influencerDoc, influencerData);
        } else {
            influencerData.status = influencerData.status || 'prospeccao';
            influencerData.postagens = [];
            await addDoc(influencersCollectionRef, influencerData);
        }
        closeModal();
        await loadData(false);
    } catch (error) {
        console.error("Erro ao salvar influenciador:", error);
        alert("Ocorreu um erro ao salvar. Tente novamente.");
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }
}

async function handleDeleteInfluencer(influencerId) {
    if (window.confirm("Tem certeza que deseja EXCLUIR este influenciador? Esta ação é irreversível.")) {
        try {
            const influencerDoc = doc(db, "influencers", influencerId);
            await deleteDoc(influencerDoc);
            await loadData(false);
        } catch (error) {
            console.error("Erro ao excluir influenciador:", error);
            alert("Ocorreu um erro ao excluir.");
        }
    }
}

// --- Funções de Renderização da UI ---

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
        'prospeccao': 'bg-yellow-500/20 text-yellow-400', 'nao-fechou': 'bg-red-500/20 text-red-400',
        'negociacao': 'bg-blue-500/20 text-blue-400', 'ativo': 'bg-green-500/20 text-green-400',
        'pausado': 'bg-gray-500/20 text-gray-400'
    };

    const influencersHTML = influencers.map(inf => {
        const hasResponded = inf.abTest && inf.abTest.respondeu;
        const hasConverted = inf.abTest && inf.abTest.converteu;

        return `
        <tr class="border-b border-gray-700 hover:bg-gray-700/30">
            <td class="px-6 py-4 font-medium text-gray-200">${inf.nome || '-'}</td>
            <td class="px-6 py-4"><a href="https://instagram.com/${(inf.instagram || '').replace('@','')}" target="_blank" class="text-blue-400 hover:underline">${inf.instagram || '-'}</a></td>
            <td class="px-6 py-4">${(inf.seguidoresIG || 0).toLocaleString('pt-BR')}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs font-medium rounded-full ${statusColors[inf.status] || ''}">${inf.status || 'sem status'}</span></td>
            <td class="px-6 py-4">R$ ${(inf.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td class="px-6 py-4">${inf.nicho || '-'}</td>
            <td class="px-6 py-4">
                 <div class="flex items-center gap-2 text-gray-400">
                    <button class="schedule-followup-btn p-1 hover:text-cyan-400" data-id="${inf.id}" title="Agendar Follow-up"><i data-lucide="calendar-plus" class="w-4 h-4"></i></button>
                    <span class="border-l border-gray-600 h-6"></span>
                    <button class="test-message-btn p-1 hover:text-purple-400" data-id="${inf.id}" title="Enviar Teste A/B"><i data-lucide="beaker" class="w-4 h-4"></i></button>
                    <button class="mark-response-btn p-1 ${inf.abTest && !hasResponded ? 'hover:text-green-400' : 'opacity-30 cursor-not-allowed'}" data-id="${inf.id}" title="Marcar Resposta" ${!inf.abTest || hasResponded ? 'disabled' : ''}><i data-lucide="message-square" class="w-4 h-4"></i></button>
                    <button class="mark-conversion-btn p-1 ${hasResponded && !hasConverted ? 'hover:text-blue-400' : 'opacity-30 cursor-not-allowed'}" data-id="${inf.id}" title="Marcar Conversão" ${!hasResponded || hasConverted ? 'disabled' : ''}><i data-lucide="star" class="w-4 h-4"></i></button>
                    <span class="border-l border-gray-600 h-6 mx-2"></span>
                    <button class="edit-btn p-1 hover:text-white" data-id="${inf.id}" title="Editar"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button class="delete-btn p-1 hover:text-red-500" data-id="${inf.id}" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>
    `}).join('');

    if (append && tableBody) {
        tableBody.innerHTML += influencersHTML;
    } else {
        container.innerHTML = `
            <div class="bg-gray-800 rounded-lg overflow-x-auto">
                <table class="w-full text-sm text-left text-gray-300">
                    <thead class="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" class="px-6 py-3">Nome</th>
                            <th scope="col" class="px-6 py-3">Instagram</th>
                            <th scope="col" class="px-6 py-3">Seguidores</th>
                            <th scope="col" class="px-6 py-3">Status</th>
                            <th scope="col" class="px-6 py-3">Valor</th>
                            <th scope="col" class="px-6 py-3">Nicho</th>
                            <th scope="col" class="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>${influencersHTML.length > 0 ? influencersHTML : '<tr><td colspan="7" class="text-center py-8 text-gray-500">Nenhum influenciador encontrado.</td></tr>'}</tbody>
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
        <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto">
            <div class="bg-gray-800 border border-slate-700 rounded-lg p-8 w-full max-w-4xl shadow-2xl my-8 relative">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-emerald-400">${influencer ? 'Editar' : 'Novo'} Influenciador</h2>
                    <button id="cancel-btn" class="text-slate-400 hover:text-white">&times;</button>
                </div>
                <form id="influencer-form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label class="text-sm">Nome *</label><input required type="text" name="nome" value="${influencer?.nome || ''}" class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                        <div><label class="text-sm">Nicho</label><input type="text" name="nicho" value="${influencer?.nicho || ''}" class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label class="text-sm">Instagram</label><input type="text" name="instagram" value="${influencer?.instagram || ''}" class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                        <div><label class="text-sm">TikTok</label><input type="text" name="tiktok" value="${influencer?.tiktok || ''}" class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div><label class="text-sm">Seguidores IG</label><input type="number" name="seguidoresIG" value="${influencer?.seguidoresIG || 0}" class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                        <div><label class="text-sm">Engajamento IG (%)</label><input type="number" step="0.01" name="engajamentoIG" value="${influencer?.engajamentoIG || 0}" class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                        <div><label class="text-sm">Seguidores TT</label><input type="number" name="seguidoresTT" value="${influencer?.seguidoresTT || 0}" class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                        <div><label class="text-sm">Engajamento TT (%)</label><input type="number" step="0.01" name="engajamentoTT" value="${influencer?.engajamentoTT || 0}" class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label class="text-sm">Status</label><select name="status" class="w-full bg-gray-900 p-2 mt-1 rounded">${statusOptions.map(opt => `<option value="${opt}" ${influencer?.status === opt ? 'selected' : ''}>${opt.charAt(0).toUpperCase() + opt.slice(1)}</option>`).join('')}</select></div>
                        <div><label class="text-sm">Tipo de Parceria</label><select name="tipoParceria" class="w-full bg-gray-900 p-2 mt-1 rounded">${parceriaOptions.map(opt => `<option value="${opt}" ${influencer?.tipoParceria === opt ? 'selected' : ''}>${opt.charAt(0).toUpperCase() + opt.slice(1)}</option>`).join('')}</select></div>
                        <div><label class="text-sm">Valor (R$)</label><input type="number" step="0.01" name="valor" value="${influencer?.valor || 0}" class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                    </div>
                    <div class="flex justify-end gap-4 pt-4">
                        <button type="button" id="form-close-btn" class="px-6 py-2 border rounded">Cancelar</button>
                        <button type="submit" class="px-6 py-2 bg-green-500 rounded font-semibold">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('form-close-btn').addEventListener('click', closeModal);
    document.getElementById('influencer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const influencerData = Object.fromEntries(formData.entries());
        influencerData.valor = parseFloat(influencerData.valor) || 0;
        influencerData.seguidoresIG = parseInt(influencerData.seguidoresIG, 10) || 0;
        influencerData.seguidoresTT = parseInt(influencerData.seguidoresTT, 10) || 0;
        influencerData.engajamentoIG = parseFloat(influencerData.engajamentoIG) || 0;
        influencerData.engajamentoTT = parseFloat(influencerData.engajamentoTT) || 0;
        handleSaveInfluencer(influencerData, e.target);
    });
}
// --- Funções do Modal de Teste A/B ---

function openTestMessageModal(influencerId) {
    const influencer = influencers.find(inf => inf.id === influencerId);
    if (!influencer) return;
    if (activeTests.length === 0) {
        alert("Nenhum teste A/B ativo. Crie um na página de Testes A/B primeiro.");
        return;
    }
    const modalContainer = document.getElementById('modal-container');
    const testOptions = activeTests.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 border border-slate-700 rounded-lg p-8 w-full max-w-3xl">
                <h2 class="text-xl font-bold mb-6">Testar Mensagem para ${influencer.nome}</h2>
                <div class="space-y-4">
                    <div><label class="text-sm">Selecione o Teste A/B</label><select id="test-selector" class="w-full bg-gray-900 p-2 mt-1 rounded">${testOptions}</select></div>
                    <div id="variants-container" class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4"></div>
                </div>
                <div class="flex justify-end gap-4 mt-8"><button type="button" id="cancel-modal-btn" class="px-6 py-2 border rounded">Cancelar</button></div>
            </div>
        </div>
    `;
    const testSelector = document.getElementById('test-selector');
    testSelector.addEventListener('change', () => displayVariants(testSelector.value, influencerId));
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    displayVariants(testSelector.value, influencerId);
}

function displayVariants(testId, influencerId) {
    const container = document.getElementById('variants-container');
    const test = activeTests.find(t => t.id === testId);
    if (!container || !test) return;
    container.innerHTML = `
        <div class="bg-gray-900 p-4 rounded-lg">
            <h3 class="font-semibold mb-2">Variante A</h3>
            <p class="text-sm text-gray-300 whitespace-pre-wrap mb-4">${test.varianteA.texto}</p>
            <button class="send-variant-btn w-full bg-green-500 p-2 rounded" data-variant="A" data-testid="${testId}" data-influencerid="${influencerId}" data-testname="${test.nome}">Enviar Variante A</button>
        </div>
        <div class="bg-gray-900 p-4 rounded-lg">
            <h3 class="font-semibold mb-2">Variante B</h3>
            <p class="text-sm text-gray-300 whitespace-pre-wrap mb-4">${test.varianteB.texto}</p>
            <button class="send-variant-btn w-full bg-purple-500 p-2 rounded" data-variant="B" data-testid="${testId}" data-influencerid="${influencerId}" data-testname="${test.nome}">Enviar Variante B</button>
        </div>
    `;
    document.querySelectorAll('.send-variant-btn').forEach(btn => btn.addEventListener('click', handleSendVariant));
}

async function handleSendVariant(e) {
    const { testid, variant, influencerid, testname } = e.target.dataset;
    const testDocRef = doc(db, "ab_tests", testid);
    const influencerDocRef = doc(db, "influencers", influencerid);
    const fieldToUpdate = variant === 'A' ? 'varianteA.enviados' : 'varianteB.enviados';
    try {
        await updateDoc(testDocRef, { [fieldToUpdate]: increment(1) });
        await updateDoc(influencerDocRef, { abTest: { testId: testid, testName: testname, variant: variant, sentAt: serverTimestamp(), respondeu: false, converteu: false } });
        alert(`Variante ${variant} registrada como enviada!`);
        closeModal();
        loadData();
    } catch (error) { console.error("Erro ao registrar envio:", error); }
}

// ATUALIZADO: Altera o status para "ativo" ao marcar a conversão
async function handleMarkMetric(influencerId, metric) {
    const influencer = influencers.find(inf => inf.id === influencerId);
    if (!influencer || !influencer.abTest) return;

    const { testId, variant } = influencer.abTest;
    const testDocRef = doc(db, "ab_tests", testId);
    const influencerDocRef = doc(db, "influencers", influencerId);

    const fieldToUpdate = variant === 'A' ? `varianteA.${metric}s` : `varianteB.${metric}s`;
    
    // Prepara os dados para atualização do influenciador
    const updateData = {};
    if (metric === 'resposta') {
        updateData['abTest.respondeu'] = true;
    } else if (metric === 'conversao') {
        updateData['abTest.converteu'] = true;
        updateData['status'] = 'ativo'; // Muda o status para "ativo" na conversão
    }

    try {
        await updateDoc(testDocRef, { [fieldToUpdate]: increment(1) });
        await updateDoc(influencerDocRef, updateData);
        
        alert(`Métrica "${metric}" registrada com sucesso!`);
        loadData();
    } catch (error) { console.error(`Erro ao registrar ${metric}:`, error); }
}

// --- Funções do Follow-up ---
function openFollowUpModal(influencerId) {
    const influencer = influencers.find(inf => inf.id === influencerId);
    if (!influencer) return;

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 border border-slate-700 rounded-lg p-8 w-full max-w-2xl shadow-2xl">
                <h2 class="text-xl font-bold text-white mb-6">Agendar Follow-up para ${influencer.nome}</h2>
                <form id="followup-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="text-sm">Tipo</label>
                            <select name="tipo" class="w-full bg-gray-900 p-2 mt-1 rounded">
                                <option value="dm">DM Instagram</option>
                                <option value="email">Email</option>
                                <option value="whatsapp">WhatsApp</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-sm">Prioridade</label>
                            <select name="prioridade" class="w-full bg-gray-900 p-2 mt-1 rounded">
                                <option value="baixa">Baixa</option>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="text-sm">Agendar para</label>
                        <select name="dias" class="w-full bg-gray-900 p-2 mt-1 rounded">
                            <option value="4">Daqui a 4 dias</option>
                            <option value="7">Daqui a 7 dias</option>
                            <option value="15">Daqui a 15 dias</option>
                            <option value="30">Daqui a 30 dias</option>
                        </select>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <label class="text-sm">Mensagem</label>
                            <button type="button" id="use-template-btn" class="text-xs text-purple-400 hover:underline">Usar Template</button>
                        </div>
                        <textarea name="mensagem" id="followup-message" rows="6" class="w-full bg-gray-900 p-2 rounded" placeholder="Escreva a mensagem do follow-up..."></textarea>
                    </div>
                    <div class="flex justify-end gap-4 pt-4">
                        <button type="button" id="cancel-modal-btn" class="px-6 py-2 border rounded">Cancelar</button>
                        <button type="submit" class="px-6 py-2 bg-cyan-500 rounded font-semibold">Agendar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    document.getElementById('use-template-btn').addEventListener('click', openTemplateSelector);
    document.getElementById('followup-form').addEventListener('submit', (e) => handleScheduleFollowUp(e, influencer));
}

function openTemplateSelector() {
    if (messageTemplates.length === 0) {
        alert("Nenhum template de mensagem encontrado. Implemente uma variante vencedora de um Teste A/B para criar um.");
        return;
    }
    const templateOptions = messageTemplates.map(t => `<li class="p-2 hover:bg-gray-700 cursor-pointer" data-templateid="${t.id}">${t.nome}</li>`).join('');
    const templateList = document.createElement('ul');
    templateList.className = 'absolute bottom-full mb-2 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10';
    templateList.innerHTML = templateOptions;

    const messageTextarea = document.getElementById('followup-message');
    messageTextarea.parentElement.classList.add('relative');
    messageTextarea.parentElement.appendChild(templateList);

    templateList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const templateId = e.target.dataset.templateid;
            const template = messageTemplates.find(t => t.id === templateId);
            if (template) {
                messageTextarea.value = template.texto;
            }
            templateList.remove();
        }
    });
}

async function handleScheduleFollowUp(e, influencer) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const followUpData = Object.fromEntries(formData.entries());

    const dias = parseInt(followUpData.dias, 10);
    const dataAgendada = new Date();
    dataAgendada.setDate(dataAgendada.getDate() + dias);

    const newFollowUp = {
        influencerId: influencer.id,
        influencerName: influencer.nome,
        influencerAvatar: influencer.nome?.[0]?.toUpperCase() || '?',
        tipo: followUpData.tipo,
        prioridade: followUpData.prioridade,
        dataAgendada: dataAgendada, // Salva como objeto Date do JS
        mensagem: followUpData.mensagem,
        status: 'follow_up',
        criadoEm: serverTimestamp()
    };

    try {
        await addDoc(followUpsCollectionRef, newFollowUp);
        alert(`Follow-up agendado para ${influencer.nome} em ${dias} dias!`);
        closeModal();
    } catch (error) {
        console.error("Erro ao agendar follow-up:", error);
        alert("Não foi possível agendar o follow-up.");
    }
}

// --- Funções do Calendário de Postagens ---

function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    if (calendar) calendar.destroy();
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', locale: 'pt-br', events: getCalendarEvents(), editable: true,
        dateClick: (info) => openAddPostModal(info.dateStr), eventClick: (info) => openEditPostModal(info),
        eventDrop: handleEventDrop, headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }
    });
}
function getCalendarEvents() {
    const events = [];
    influencers.forEach(inf => {
        (inf.postagens || []).forEach(post => {
            let props = { title: inf.nome, start: post.date, allDay: true, color: '#8B5CF6', extendedProps: { postId: post.id, influencerId: inf.id } };
            if (post.horario) { props.title = `${post.horario} - ${inf.nome}`; props.start = `${post.date}T${post.horario}`; props.allDay = false; }
            events.push(props);
        });
    });
    return events;
}
function openCalendarModal() {
    const modal = document.getElementById('calendar-modal-container');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => { if (calendar) calendar.render(); }, 10);
}
function closeCalendarModal() {
    const modal = document.getElementById('calendar-modal-container');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}
async function handleEventDrop(info) {
    const { event } = info;
    const { postId, influencerId } = event.extendedProps;
    const newDate = event.start.toISOString().split('T')[0];
    if (!window.confirm(`Mover a postagem de "${event.title}" para ${new Date(newDate + 'T12:00:00').toLocaleDateString()}?`)) {
        info.revert(); return;
    }
    const influencerDocRef = doc(db, "influencers", influencerId);
    try {
        const docSnap = await getDoc(influencerDocRef);
        if (!docSnap.exists()) throw new Error("Influenciador não encontrado.");
        const influencer = docSnap.data();
        const postagens = influencer.postagens || [];
        const postIndex = postagens.findIndex(p => p.id === postId);
        if (postIndex === -1) throw new Error("Postagem não encontrada.");
        postagens[postIndex].date = newDate;
        await updateDoc(influencerDocRef, { postagens });
        const localInfluencer = influencers.find(inf => inf.id === influencerId);
        if (localInfluencer) {
            const localPost = (localInfluencer.postagens || []).find(p => p.id === postId);
            if (localPost) localPost.date = newDate;
        }
        alert("Postagem atualizada!");
        refreshCalendar();
    } catch (error) {
        console.error("Erro ao atualizar postagem:", error);
        info.revert();
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
        <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-lg p-8 w-full max-w-lg">
                <h2 class="text-xl font-bold mb-6">Agendar Postagem</h2>
                <form id="add-post-form" class="space-y-4">
                    <input type="hidden" name="date" value="${date}">
                    <div><label class="text-sm">Influenciador</label><select name="influencerId" required class="w-full bg-gray-900 p-2 mt-1 rounded">${options}</select></div>
                    <div><label class="text-sm">Tipo de Postagem</label><input name="tipo" type="text" placeholder="Ex: Story, Reels" required class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                    <div><label class="text-sm">Horário</label><input name="horario" type="time" required class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                    <div class="flex justify-end gap-4 pt-4">
                        <button type="button" class="cancel-post-btn px-6 py-2 border rounded">Cancelar</button>
                        <button type="submit" class="px-6 py-2 bg-purple-500 rounded font-semibold">Agendar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    modalContainer.querySelector('.cancel-post-btn').addEventListener('click', closeModal);
    modalContainer.querySelector('#add-post-form').addEventListener('submit', handleAddPostSubmit);
}
function openEditPostModal(info) {
    const { event } = info;
    const { postId, influencerId } = event.extendedProps;
    const influencer = influencers.find(inf => inf.id === influencerId);
    if (!influencer) return;
    const post = (influencer.postagens || []).find(p => p.id === postId);
    if (!post) return;
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-lg p-8 w-full max-w-lg">
                <h2 class="text-xl font-bold mb-6">Editar Postagem de ${influencer.nome}</h2>
                <form id="edit-post-form" class="space-y-4">
                    <input type="hidden" name="postId" value="${postId}">
                    <input type="hidden" name="influencerId" value="${influencerId}">
                    <div><label class="text-sm">Tipo</label><input name="tipo" type="text" value="${post.tipo || ''}" required class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                    <div><label class="text-sm">Horário</label><input name="horario" type="time" value="${post.horario || ''}" required class="w-full bg-gray-900 p-2 mt-1 rounded"></div>
                    <div class="flex justify-between items-center pt-4">
                        <button type="button" class="delete-post-btn px-6 py-2 bg-red-600 rounded font-semibold">Excluir</button>
                        <div class="flex gap-4">
                            <button type="button" class="cancel-post-btn px-6 py-2 border rounded">Cancelar</button>
                            <button type="submit" class="px-6 py-2 bg-green-500 rounded font-semibold">Salvar</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;
    modalContainer.querySelector('.cancel-post-btn').addEventListener('click', closeModal);
    modalContainer.querySelector('#edit-post-form').addEventListener('submit', handleEditPostSubmit);
    modalContainer.querySelector('.delete-post-btn').addEventListener('click', () => handleDeletePost(influencerId, postId));
}
async function handleAddPostSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const postData = Object.fromEntries(formData.entries());
    const influencerDocRef = doc(db, "influencers", postData.influencerId);
    try {
        const docSnap = await getDoc(influencerDocRef);
        if (!docSnap.exists()) throw new Error("Influenciador não encontrado.");
        const influencer = docSnap.data();
        const newPost = { id: `post_${Date.now()}`, date: postData.date, tipo: postData.tipo, horario: postData.horario };
        const updatedPostagens = [...(influencer.postagens || []), newPost];
        await updateDoc(influencerDocRef, { postagens: updatedPostagens, ultimaPostagem: postData.date });
        const localInfluencer = influencers.find(inf => inf.id === postData.influencerId);
        if (localInfluencer) localInfluencer.postagens = updatedPostagens;
        closeModal();
        refreshCalendar();
        alert("Postagem agendada!");
    } catch (error) { console.error("Erro ao agendar postagem:", error); }
}
async function handleEditPostSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const postData = Object.fromEntries(formData.entries());
    const influencerDocRef = doc(db, "influencers", postData.influencerId);
    try {
        const docSnap = await getDoc(influencerDocRef);
        if (!docSnap.exists()) throw new Error("Influenciador não encontrado.");
        const influencer = docSnap.data();
        const postagens = influencer.postagens || [];
        const postIndex = postagens.findIndex(p => p.id === postData.postId);
        if (postIndex === -1) throw new Error("Postagem não encontrada.");
        postagens[postIndex].tipo = postData.tipo;
        postagens[postIndex].horario = postData.horario;
        await updateDoc(influencerDocRef, { postagens });
        const localInfluencer = influencers.find(inf => inf.id === postData.influencerId);
        if (localInfluencer) localInfluencer.postagens = postagens;
        closeModal();
        refreshCalendar();
        alert("Postagem atualizada!");
    } catch (error) { console.error("Erro ao editar postagem:", error); }
}
async function handleDeletePost(influencerId, postId) {
    if (!window.confirm("Excluir esta postagem?")) return;
    const influencerDocRef = doc(db, "influencers", influencerId);
    try {
        const docSnap = await getDoc(influencerDocRef);
        if (!docSnap.exists()) throw new Error("Influenciador não encontrado.");
        const influencer = docSnap.data();
        const updatedPostagens = (influencer.postagens || []).filter(p => p.id !== postId);
        await updateDoc(influencerDocRef, { postagens: updatedPostagens });
        const localInfluencer = influencers.find(inf => inf.id === influencerId);
        if (localInfluencer) localInfluencer.postagens = updatedPostagens;
        closeModal();
        refreshCalendar();
        alert("Postagem excluída!");
    } catch (error) { console.error("Erro ao excluir postagem:", error); }
}
function refreshCalendar() { if (calendar) { calendar.removeAllEvents(); calendar.addEventSource(getCalendarEvents()); } }

// --- Anexar Eventos e Inicialização ---

function attachEventListeners() {
    document.getElementById('add-influencer-btn')?.addEventListener('click', () => openModal(null));
    document.getElementById('calendar-btn')?.addEventListener('click', openCalendarModal);
    document.getElementById('close-calendar-btn')?.addEventListener('click', closeCalendarModal);
    document.body.addEventListener('click', (e) => { if (e.target.matches('#load-more-btn')) loadData(true); });
    document.querySelector('#table-container')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        if (target.classList.contains('edit-btn')) openModal(influencers.find(inf => inf.id === id));
        else if (target.classList.contains('delete-btn')) handleDeleteInfluencer(id);
        else if (target.classList.contains('test-message-btn')) openTestMessageModal(id);
        else if (target.classList.contains('mark-response-btn')) handleMarkMetric(id, 'resposta');
        else if (target.classList.contains('mark-conversion-btn')) handleMarkMetric(id, 'conversao');
        else if (target.classList.contains('schedule-followup-btn')) openFollowUpModal(id);
    });
}

function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            user = currentUser;
            loadData();
        }
    });
});