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
        <div class="max-w-7xl mx-auto p-6">
            <div id="assistant-header" class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        Rotina & Metas
                    </h1>
                    <p class="text-slate-400">Dashboard de produtividade e CRM avançado</p>
                </div>
                <div id="edit-buttons-container">
                    </div>
            </div>
            <div id="routine-tab-content">
                ${loading ? '<div>Carregando...</div>' : renderRoutineTabContent()}
            </div>
        </div>
    `;
    
    document.getElementById('app').innerHTML = pageContent;
    renderLayout(user, document.getElementById('app').innerHTML);
    renderEditButtons();
    attachEventListeners();
    lucide.createIcons();
}

function renderEditButtons() {
    const container = document.getElementById('edit-buttons-container');
    if (!container) return;
    
    if (user?.email === 'admin@example.com') {
        if (editMode) {
            container.innerHTML = `
                <div class="flex gap-2">
                    <button id="save-config-btn" class="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-md flex items-center gap-2">
                        <i data-lucide="save" class="w-4 h-4"></i> Salvar
                    </button>
                    <button id="cancel-edit-btn" class="border border-slate-600 text-slate-300 px-4 py-2 rounded-md flex items-center gap-2">
                        <i data-lucide="x" class="w-4 h-4"></i> Cancelar
                    </button>
                </div>`;
        } else {
            container.innerHTML = `
                <button id="edit-config-btn" class="border border-slate-600 text-slate-300 px-4 py-2 rounded-md flex items-center gap-2">
                    <i data-lucide="edit" class="w-4 h-4"></i> Editar
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
                    <div class="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                        ${editMode ? `
                            <input class="meta-title-input bg-slate-900/50 w-full p-1 mb-1 rounded" data-meta-key="${metaKey}" value="${meta.titulo || ''}" placeholder="Título">
                            <input class="meta-subtitle-input bg-slate-900/50 w-full p-1 mb-2 rounded" data-meta-key="${metaKey}" value="${meta.subtitulo || ''}" placeholder="Subtítulo">
                            <input type="number" class="meta-target-input bg-slate-900/50 w-full p-1 mb-4 rounded" data-meta-key="${metaKey}" value="${meta.alvo || 0}" placeholder="Alvo">
                        ` : `
                            <h3 class="text-lg font-semibold text-slate-200">${meta.titulo}</h3>
                            <p class="text-sm text-slate-400 mb-4">${meta.subtitulo}</p>
                        `}
                        <div class="flex items-center justify-between mb-4">
                            <div class="text-3xl font-bold text-slate-200">${currentValue}</div>
                            <div class="text-right">
                                <div class="text-sm text-slate-400">Meta: ${target}</div>
                                <div class="text-xs text-slate-500">${percentage.toFixed(1)}%</div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="meta-change-btn border border-slate-600 rounded p-2" data-meta-key="${metaKey}" data-increment="-1" ${currentValue <= 0 ? 'disabled' : ''}>-</button>
                            <button class="meta-change-btn bg-emerald-500 text-white rounded p-2 flex-1" data-meta-key="${metaKey}" data-increment="1">+</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                    <h3 class="text-xl font-bold text-slate-200 mb-4">Rotina Diária</h3>
                    <div id="routine-list" class="space-y-3">
                        ${rotina.map(task => `
                            <div class="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                                <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${checklist[task.id] ? 'checked' : ''} ${editMode ? 'disabled' : ''}>
                                ${editMode ? `
                                <input class="routine-text-input bg-slate-900/50 flex-1 p-1 rounded" data-task-id="${task.id}" value="${task.texto}">
                                ` : `
                                <span class="flex-1 ${checklist[task.id] ? 'line-through text-slate-500' : 'text-slate-200'}">${task.texto}</span>
                                `}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                    <h3 class="text-xl font-bold text-slate-200 mb-4">Notas do Dia</h3>
                    <textarea id="notes-area" class="w-full h-48 bg-slate-900/50 border border-slate-600 rounded-md p-2 text-slate-200">${progress.notas || ''}</textarea>
                </div>
            </div>
        </div>
    `;
}

async function handleMetaChange(metaKey, increment) {
    const currentValue = progress.metas?.[metaKey] || 0;
    const newValue = Math.max(0, currentValue + increment);
    
    progress.metas[metaKey] = newValue;
    progress.data = new Date().toISOString().split('T')[0];

    try {
        if (progress.id) {
            await updateDoc(doc(db, "assistant_progress", progress.id), progress);
        } else {
            const newDocRef = await addDoc(collection(db, "assistant_progress"), progress);
            progress.id = newDocRef.id;
        }
        renderPage();
    } catch (e) { console.error(e); }
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
    } catch(e) { console.error(e); }
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
    } catch(e) { console.error(e); }
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
        loadData();
    } catch (error) {
        console.error("Erro ao salvar configuração:", error);
    }
}

function attachEventListeners() {
    document.querySelectorAll('.meta-change-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = e.currentTarget.dataset.metaKey;
            const increment = parseInt(e.currentTarget.dataset.increment, 10);
            handleMetaChange(key, increment);
        });
    });

    document.querySelectorAll('.task-checkbox').forEach(box => {
        box.addEventListener('change', (e) => {
            const id = e.currentTarget.dataset.taskId;
            handleTaskToggle(id, e.currentTarget.checked);
        });
    });

    const notesArea = document.getElementById('notes-area');
    if(notesArea) {
        notesArea.addEventListener('blur', (e) => handleNotesUpdate(e.target.value));
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
            document.getElementById('app').innerHTML = '<div id="app-content"></div>';
            loadData();
        }
    });
});