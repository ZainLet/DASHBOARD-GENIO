import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { 
    collection, 
    getDocs, 
    doc, 
    updateDoc, 
    setDoc, 
    addDoc 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { renderLayout } from './shared.js';

let config = null;
let progress = null;
let user = null;
let loading = true;
let editMode = false;
let editedConfig = null;

async function loadData() {
    loading = true;
    renderPage();
    try {
        const configCollectionRef = collection(db, "assistant_configs");
        const progressCollectionRef = collection(db, "assistant_progress");

        const [configSnapshot, progressSnapshot] = await Promise.all([
            getDocs(configCollectionRef),
            getDocs(progressCollectionRef)
        ]);
        
        config = configSnapshot.docs.length > 0 
            ? { ...configSnapshot.docs[0].data(), id: configSnapshot.docs[0].id }
            : null;
            
        progress = progressSnapshot.docs.length > 0 
            ? { ...progressSnapshot.docs[0].data(), id: progressSnapshot.docs[0].id }
            : { metas: {}, checklist: {}, notas: '', data: new Date().toISOString().split('T')[0] };

        editedConfig = JSON.parse(JSON.stringify(config));
        
        loading = false;
        renderPage();
    } catch (error) {
        console.error("Erro ao carregar dados do Assistant:", error);
        document.getElementById('app-content').innerHTML = `<div>Erro ao carregar dados.</div>`;
    }
}

function renderPage() {
    const pageContent = `
        <div class="max-w-7xl mx-auto p-6 animated fade-in">
            <div id="assistant-header" class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-100">Rotina & Metas</h1>
                    <p class="text-gray-400 mt-1">Dashboard de produtividade e CRM avançado</p>
                </div>
                <div id="edit-buttons-container">
                </div>
            </div>
            <div id="routine-tab-content">
                ${loading ? '<div class="text-center text-gray-400">Carregando...</div>' : renderRoutineTabContent()}
            </div>
        </div>
    `;
    
    renderLayout(user, pageContent);
    
    renderEditButtons();
    attachEventListeners();
    lucide.createIcons();
}


function renderEditButtons() {
    const container = document.getElementById('edit-buttons-container');
    if (!container) return;
    
    if (user?.email === 'seu-email-de-admin@exemplo.com') { // Lógica de Admin
        if (editMode) {
            container.innerHTML = `
                <div class="flex gap-2">
                    <button id="save-config-btn" class="bg-green-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-90 font-semibold">
                        <i data-lucide="save" class="w-4 h-4"></i> Salvar
                    </button>
                    <button id="cancel-edit-btn" class="border border-gray-600 text-gray-300 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-700 font-semibold">
                        <i data-lucide="x" class="w-4 h-4"></i> Cancelar
                    </button>
                </div>`;
        } else {
            container.innerHTML = `
                <button id="edit-config-btn" class="border border-gray-600 text-gray-300 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-700 font-semibold">
                    <i data-lucide="edit" class="w-4 h-4"></i> Editar Configuração
                </button>`;
        }
    } else {
        container.innerHTML = '';
    }
}

function renderRoutineTabContent() {
    const metaConfig = (editMode ? editedConfig?.metaConfig : config?.metaConfig) || {};
    const progressMetas = progress?.metas || {};
    const checklist = progress?.checklist || {};
    const rotina = (editMode ? editedConfig?.rotina : config?.rotina) || [];

    return `
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${Object.keys(metaConfig).map((metaKey, index) => {
                    const meta = metaConfig[metaKey] || {};
                    const currentValue = progressMetas[metaKey] || 0;
                    const target = meta.alvo || 0;
                    const percentage = target > 0 ? Math.min((currentValue / target) * 100, 100) : 0;
                    return `
                    <div class="bg-gray-800 p-6 rounded-lg animated slide-in-up stagger-${index + 1}">
                        ${editMode ? `
                            <input class="meta-title-input bg-gray-900 w-full p-1 mb-1 rounded border border-gray-600" data-meta-key="${metaKey}" value="${meta.titulo || ''}" placeholder="Título">
                            <input class="meta-subtitle-input bg-gray-900 w-full p-1 mb-2 rounded border border-gray-600" data-meta-key="${metaKey}" value="${meta.subtitulo || ''}" placeholder="Subtítulo">
                            <input type="number" class="meta-target-input bg-gray-900 w-full p-1 mb-4 rounded border border-gray-600" data-meta-key="${metaKey}" value="${meta.alvo || 0}" placeholder="Alvo">
                        ` : `
                            <h3 class="text-lg font-semibold text-gray-200">${meta.titulo || 'Meta sem título'}</h3>
                            <p class="text-sm text-gray-400 mb-4">${meta.subtitulo || 'Sem descrição'}</p>
                        `}
                        <div class="flex items-center justify-between mb-4">
                            <div class="text-3xl font-bold text-gray-100">${currentValue}</div>
                            <div class="text-right">
                                <div class="text-sm text-gray-400">Meta: ${target}</div>
                                <div class="text-xs text-gray-500">${percentage.toFixed(1)}%</div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="meta-change-btn border border-gray-600 rounded p-2 w-10 hover:bg-gray-700 disabled:opacity-50" data-meta-key="${metaKey}" data-increment="-1" ${currentValue <= 0 ? 'disabled' : ''}>-</button>
                            <button class="meta-change-btn bg-green-500 text-white rounded p-2 flex-1 hover:opacity-90" data-meta-key="${metaKey}" data-increment="1">+</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-gray-800 p-6 rounded-lg animated slide-in-up">
                    <h3 class="text-xl font-bold text-gray-200 mb-4">Rotina Diária</h3>
                    <div id="routine-list" class="space-y-3">
                        ${rotina.map(task => `
                            <div class="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                                <input type="checkbox" class="task-checkbox h-5 w-5 rounded bg-gray-900 border-gray-600 text-green-500 focus:ring-green-500" data-task-id="${task.id}" ${checklist[task.id] ? 'checked' : ''} ${editMode ? 'disabled' : ''}>
                                ${editMode ? `
                                <input class="routine-text-input bg-gray-900 flex-1 p-1 rounded border border-gray-600" data-task-id="${task.id}" value="${task.texto}">
                                ` : `
                                <span class="flex-1 ${checklist[task.id] ? 'line-through text-gray-500' : 'text-gray-200'}">${task.texto}</span>
                                `}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="bg-gray-800 p-6 rounded-lg animated slide-in-up">
                    <h3 class="text-xl font-bold text-gray-200 mb-4">Notas do Dia</h3>
                    <textarea id="notes-area" class="w-full h-48 bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-green-500 outline-none">${progress.notas || ''}</textarea>
                </div>
            </div>
        </div>
    `;
}

async function handleMetaChange(metaKey, increment) {
    const currentValue = progress.metas?.[metaKey] || 0;
    const newValue = Math.max(0, currentValue + increment);
    
    if (!progress.metas) progress.metas = {};
    progress.metas[metaKey] = newValue;
    progress.data = new Date().toISOString().split('T')[0];

    try {
        if (progress.id) {
            await updateDoc(doc(db, "assistant_progress", progress.id), { metas: progress.metas, data: progress.data });
        } else {
            const newDocRef = await addDoc(collection(db, "assistant_progress"), progress);
            progress.id = newDocRef.id;
        }
        renderPage();
    } catch (e) { console.error("Erro ao atualizar meta:", e); }
}

async function handleTaskToggle(taskId, checked) {
    if (!progress.checklist) progress.checklist = {};
    progress.checklist[taskId] = checked;
    progress.data = new Date().toISOString().split('T')[0];

    try {
        if (progress.id) {
            await updateDoc(doc(db, "assistant_progress", progress.id), { checklist: progress.checklist, data: progress.data });
        } else {
             const newDocRef = await addDoc(collection(db, "assistant_progress"), progress);
            progress.id = newDocRef.id;
        }
        renderPage();
    } catch(e) { console.error("Erro ao atualizar tarefa:", e); }
}

async function handleNotesUpdate(notes) {
    progress.notas = notes;
    progress.data = new Date().toISOString().split('T')[0];
    try {
        if (progress.id) {
            await updateDoc(doc(db, "assistant_progress", progress.id), { notas: progress.notas, data: progress.data });
        } else {
             const newDocRef = await addDoc(collection(db, "assistant_progress"), progress);
            progress.id = newDocRef.id;
        }
    } catch(e) { console.error("Erro ao salvar notas:", e); }
}

async function handleSaveConfig() {
    if (!editedConfig) return;
    try {
        if (editedConfig.id) {
            await setDoc(doc(db, "assistant_configs", editedConfig.id), editedConfig);
        } else {
            await addDoc(collection(db, "assistant_configs"), editedConfig);
        }
        editMode = false;
        await loadData();
    } catch (error) {
        console.error("Erro ao salvar configuração:", error);
    }
}

function attachEventListeners() {
    document.getElementById('routine-tab-content')?.addEventListener('click', (e) => {
        const metaBtn = e.target.closest('.meta-change-btn');
        if (metaBtn) {
            const key = metaBtn.dataset.metaKey;
            const increment = parseInt(metaBtn.dataset.increment, 10);
            handleMetaChange(key, increment);
        }
    });

    document.getElementById('routine-tab-content')?.addEventListener('change', (e) => {
        const taskCheckbox = e.target.closest('.task-checkbox');
        if (taskCheckbox) {
            const id = taskCheckbox.dataset.taskId;
            handleTaskToggle(id, taskCheckbox.checked);
        }
    });

    const notesArea = document.getElementById('notes-area');
    if(notesArea) {
        let debounceTimer;
        notesArea.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                handleNotesUpdate(e.target.value);
            }, 1000);
        });
    }

    const editBtn = document.getElementById('edit-config-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            editMode = true;
            renderPage();
        });
    }

    const saveBtn = document.getElementById('save-config-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveConfig);
    }

    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            editMode = false;
            editedConfig = JSON.parse(JSON.stringify(config));
            renderPage();
        });
    }

    document.getElementById('routine-tab-content')?.addEventListener('input', (e) => {
        if (!editMode || !editedConfig) return;

        if (e.target.classList.contains('meta-title-input')) {
            editedConfig.metaConfig[e.target.dataset.metaKey].titulo = e.target.value;
        }
        if (e.target.classList.contains('meta-subtitle-input')) {
            editedConfig.metaConfig[e.target.dataset.metaKey].subtitulo = e.target.value;
        }
        if (e.target.classList.contains('meta-target-input')) {
            editedConfig.metaConfig[e.target.dataset.metaKey].alvo = parseInt(e.target.value, 10) || 0;
        }
        if (e.target.classList.contains('routine-text-input')) {
            const task = editedConfig.rotina.find(t => t.id === e.target.dataset.taskId);
            if(task) task.texto = e.target.value;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            user = currentUser;
            loadData();
        }
    });
});