import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { renderLayout } from './shared.js';

let user = null;
let tests = [];
let chartInstance = null;
const testsCollectionRef = collection(db, "ab_tests");

async function loadTests() {
    try {
        const data = await getDocs(testsCollectionRef);
        tests = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        renderTestCards();
    } catch (error) {
        console.error("Erro ao carregar testes A/B:", error);
        const container = document.getElementById('tests-container');
        if (container) {
            container.innerHTML = `<div class="col-span-3 text-center text-red-400 mt-10">Erro ao carregar dados. Verifique as permissões do banco de dados (Firestore Rules) e recarregue a página.</div>`;
        }
    }
}

function renderPage() {
    const pageContent = `
        <div class="max-w-7xl mx-auto p-6 animated fade-in">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-100">Testes A/B de Mensagens</h1>
                    <p class="text-gray-400 mt-1">Otimize suas conversões testando abordagens diferentes.</p>
                </div>
                <button id="add-test-btn" class="bg-green-500 hover:opacity-90 text-white font-semibold py-2 px-4 rounded-md flex items-center">
                    <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                    Novo Teste A/B
                </button>
            </div>
            <div id="tests-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                </div>
        </div>
    `;
    renderLayout(user, pageContent);
    loadTests();
    attachPageEventListeners();
    lucide.createIcons();
}

function renderTestCards() {
    const container = document.getElementById('tests-container');
    if (!container) return;

    if (tests.length === 0) {
        container.innerHTML = `<div class="col-span-3 text-center text-gray-500 mt-10">Nenhum teste A/B encontrado. Clique em "Novo Teste A/B" para começar.</div>`;
        return;
    }

    const statusStyles = {
        ativo: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-500' },
        pausado: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500' },
        finalizado: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-500' }
    };

    container.innerHTML = tests.map((test, index) => {
        const style = statusStyles[test.status] || statusStyles.pausado;
        const taxaRespostaA = test.varianteA.enviados > 0 ? ((test.varianteA.respostas / test.varianteA.enviados) * 100) : 0;
        const taxaRespostaB = test.varianteB.enviados > 0 ? ((test.varianteB.respostas / test.varianteB.enviados) * 100) : 0;
        
        // --- LÓGICA DE CORREÇÃO AQUI ---
        // Calcula o vencedor independentemente do status do teste
        let vencedor = null;
        if (taxaRespostaA > taxaRespostaB) {
            vencedor = 'A';
        } else if (taxaRespostaB > taxaRespostaA) {
            vencedor = 'B';
        }
        test.vencedora = vencedor; // Atualiza o objeto do teste com o vencedor em tempo real

        return `
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col justify-between animated slide-in-up stagger-${index + 1}">
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="font-bold text-lg text-gray-100 pr-4">${test.nome}</h3>
                        <span class="flex-shrink-0 flex items-center text-xs font-medium px-2 py-1 rounded-full ${style.bg} ${style.text}">
                            <span class="w-2 h-2 rounded-full ${style.dot} mr-2"></span>
                            ${test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                        </span>
                    </div>
                    
                    <div class="space-y-3 text-sm mb-6">
                        <div class="flex justify-between items-center p-2 rounded bg-gray-700/50 ${test.vencedora === 'A' ? 'border-l-4 border-green-400' : ''}">
                            <span class="font-semibold">Variante A</span>
                            <span class="text-gray-300">${taxaRespostaA.toFixed(1)}% Respostas</span>
                        </div>
                        <div class="flex justify-between items-center p-2 rounded bg-gray-700/50 ${test.vencedora === 'B' ? 'border-l-4 border-green-400' : ''}">
                            <span class="font-semibold">Variante B</span>
                            <span class="text-gray-300">${taxaRespostaB.toFixed(1)}% Respostas</span>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between items-center border-t border-gray-700 pt-4">
                    <span class="text-xs text-gray-400">Criado em: ${test.criadoEm?.toDate().toLocaleDateString() || 'N/D'}</span>
                    <button class="details-btn text-sm font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1" data-testid="${test.id}">
                        Ver Detalhes <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
    attachCardEventListeners();
}

function openTestModal(test = null) {
    const isEditing = test !== null;
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;
    
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto animated fade-in">
            <div class="bg-gray-800 border border-slate-700 rounded-lg p-8 w-full max-w-6xl shadow-2xl my-8 relative animated scale-in">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-emerald-400">${isEditing ? 'Editar Teste A/B' : 'Novo Teste A/B'}</h2>
                    <button id="close-modal-btn" class="text-slate-400 hover:text-white">&times;</button>
                </div>
                
                <form id="ab-test-form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Nome do Teste</label>
                            <input required type="text" name="nome" value="${test?.nome || ''}" placeholder="Ex: Contato Inicial (DM)" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 outline-none text-white">
                        </div>
                        <div>
                            <label class="text-sm font-medium text-slate-300">Tipo de Mensagem</label>
                            <select name="tipo" class="w-full bg-gray-900 p-2 mt-1 rounded border border-slate-600 outline-none text-white">
                                <option value="dm_instagram" ${test?.tipo === 'dm_instagram' ? 'selected' : ''}>DM Instagram</option>
                                <option value="email" ${test?.tipo === 'email' ? 'selected' : ''}>Email</option>
                                <option value="whatsapp" ${test?.tipo === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-200 mb-2">Variante A</h3>
                            <textarea name="varianteA_texto" rows="8" class="w-full bg-gray-900 p-2 rounded border border-slate-600 outline-none text-white" placeholder="Escreva o texto da Variante A aqui...">${test?.varianteA?.texto || ''}</textarea>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-200 mb-2">Variante B</h3>
                            <textarea name="varianteB_texto" rows="8" class="w-full bg-gray-900 p-2 rounded border border-slate-600 outline-none text-white" placeholder="Escreva o texto da Variante B aqui...">${test?.varianteB?.texto || ''}</textarea>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center pt-4">
                         <div>
                            ${isEditing ? `<button type="button" id="delete-test-btn" class="px-6 py-2 bg-red-600 text-white rounded font-semibold hover:opacity-90 flex items-center gap-2"><i data-lucide="trash-2" class="w-4 h-4"></i> Excluir</button>` : '<div></div>'}
                         </div>
                        <div class="flex justify-end gap-4">
                            <button type="button" id="cancel-modal-btn" class="px-6 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-700">Cancelar</button>
                            <button type="submit" class="px-6 py-2 bg-green-500 text-white rounded font-semibold hover:opacity-90 flex items-center justify-center">Salvar Teste</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;

    lucide.createIcons();
    document.getElementById('ab-test-form').addEventListener('submit', (e) => handleSaveTest(e, test));
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    if (isEditing) {
        document.getElementById('delete-test-btn').addEventListener('click', () => handleDeleteTest(test.id));
    }
}

async function handleSaveTest(e, existingTest) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    submitButton.disabled = true;
    submitButton.innerHTML = `<i data-lucide="refresh-cw" class="animate-spin w-4 h-4 mr-2"></i> Salvando...`;
    lucide.createIcons();

    const testData = {
        nome: formData.get('nome'),
        tipo: formData.get('tipo'),
        status: existingTest?.status || 'ativo', // Mantém o status atual ou define como ativo
        varianteA: {
            texto: formData.get('varianteA_texto'),
            enviados: existingTest?.varianteA?.enviados || 0,
            respostas: existingTest?.varianteA?.respostas || 0,
            conversoes: existingTest?.varianteA?.conversoes || 0
        },
        varianteB: {
            texto: formData.get('varianteB_texto'),
            enviados: existingTest?.varianteB?.enviados || 0,
            respostas: existingTest?.varianteB?.respostas || 0,
            conversoes: existingTest?.varianteB?.conversoes || 0
        },
    };

    try {
        if (existingTest) {
            const testDoc = doc(db, "ab_tests", existingTest.id);
            await updateDoc(testDoc, testData);
        } else {
            testData.criadoEm = serverTimestamp();
            testData.vencedora = null;
            await addDoc(testsCollectionRef, testData);
        }
        closeModal();
        loadTests();
    } catch (error) {
        console.error("Erro ao salvar teste:", error);
        alert("Não foi possível salvar o teste.");
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

async function handleDeleteTest(testId) {
    if (window.confirm("Tem certeza que deseja excluir este teste A/B? Todos os dados de performance serão perdidos.")) {
        try {
            const testDoc = doc(db, "ab_tests", testId);
            await deleteDoc(testDoc);
            closeModal();
            loadTests();
        } catch (error) {
            console.error("Erro ao excluir teste:", error);
            alert("Não foi possível excluir o teste.");
        }
    }
}


function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}

function attachPageEventListeners() {
    document.getElementById('add-test-btn')?.addEventListener('click', () => openTestModal());
}

function attachCardEventListeners() {
    document.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const test = tests.find(t => t.id === btn.dataset.testid);
            if (test) openDetailsModal(test);
        });
    });
}

function openDetailsModal(test) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto animated fade-in" id="details-modal-wrapper">
          <div class="bg-gray-800 border border-slate-700 rounded-lg p-8 w-full max-w-4xl shadow-2xl my-8 relative animated scale-in">
              <div class="flex justify-between items-center mb-6">
                  <h2 class="text-2xl font-bold text-gray-100">${test.nome}</h2>
                  <button id="close-details-modal-btn" class="text-slate-400 hover:text-white">&times;</button>
              </div>
              
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                      <h3 class="font-semibold text-lg text-emerald-400 mb-4">Performance</h3>
                      <canvas id="performanceChart"></canvas>
                      <div class="mt-6 flex justify-around text-center">
                          <div><p class="text-2xl font-bold">${test.varianteA.respostas}</p><p class="text-sm text-gray-400">Respostas A</p></div>
                          <div><p class="text-2xl font-bold">${test.varianteB.respostas}</p><p class="text-sm text-gray-400">Respostas B</p></div>
                          <div><p class="text-2xl font-bold text-green-400">${test.vencedora || 'N/A'}</p><p class="text-sm text-gray-400">Vencedora</p></div>
                      </div>
                  </div>
                  <div>
                      <h3 class="font-semibold text-lg text-purple-400 mb-4">Textos das Variantes</h3>
                      <div class="space-y-4">
                          <div>
                              <label class="font-semibold text-gray-300">Variante A</label>
                              <p class="text-sm text-gray-400 bg-gray-900 p-3 rounded-md mt-1 whitespace-pre-wrap">${test.varianteA.texto}</p>
                          </div>
                          <div>
                              <label class="font-semibold text-gray-300">Variante B</label>
                              <p class="text-sm text-gray-400 bg-gray-900 p-3 rounded-md mt-1 whitespace-pre-wrap">${test.varianteB.texto}</p>
                          </div>
                      </div>
                      <div class="flex gap-4 mt-8">
                        <button class="edit-test-btn flex-1 px-4 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-700">Editar Teste</button>
                        <button id="implement-winner-btn" class="flex-1 px-4 py-2 bg-purple-500 text-white rounded font-semibold hover:opacity-90 ${!test.vencedora ? 'opacity-50 cursor-not-allowed' : ''}" ${!test.vencedora ? 'disabled' : ''}>Implementar Variante ${test.vencedora || ''}</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    `;
    
    document.getElementById('close-details-modal-btn').addEventListener('click', closeModal);
    document.querySelector('#details-modal-wrapper').addEventListener('click', (e) => {
        if (e.target.id === 'details-modal-wrapper') closeModal();
    });
    document.querySelector('.edit-test-btn').addEventListener('click', () => {
        closeModal();
        openTestModal(test);
    });

    const implementBtn = document.getElementById('implement-winner-btn');
    if (implementBtn && test.vencedora) {
        implementBtn.addEventListener('click', () => handleImplementWinner(test));
    }
    
    const ctx = document.getElementById('performanceChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Enviados', 'Respostas', 'Conversões'],
            datasets: [{
                label: 'Variante A',
                data: [test.varianteA.enviados, test.varianteA.respostas, test.varianteA.conversoes],
                backgroundColor: 'rgba(52, 211, 153, 0.5)',
                borderColor: 'rgba(52, 211, 153, 1)',
                borderWidth: 1
            }, {
                label: 'Variante B',
                data: [test.varianteB.enviados, test.varianteB.respostas, test.varianteB.conversoes],
                backgroundColor: 'rgba(167, 139, 250, 0.5)',
                borderColor: 'rgba(167, 139, 250, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } } },
            plugins: { legend: { labels: { color: '#D1D5DB' } } }
        }
    });
}

async function handleImplementWinner(test) {
    const winnerVariant = test.vencedora === 'A' ? test.varianteA : test.varianteB;
    const templateName = `Vencedora: ${test.nome}`;

    if (!window.confirm(`Deseja salvar a Variante ${test.vencedora} como um novo template chamado "${templateName}"?`)) {
        return;
    }

    const templatesCollectionRef = collection(db, "message_templates");
    try {
        await addDoc(templatesCollectionRef, {
            nome: templateName,
            texto: winnerVariant.texto,
            tipo: test.tipo,
            criadoEm: serverTimestamp(),
            origemTesteId: test.id
        });
        alert("Template salvo com sucesso!");
    } catch (error) {
        console.error("Erro ao salvar template:", error);
        alert("Não foi possível salvar o template.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            user = currentUser;
            renderPage();
        }
    });
});