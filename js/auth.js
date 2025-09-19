import { auth } from './firebase-config.js';
import { 
    onAuthStateChanged, 
    signOut, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

function getFirebaseErrorMessage(errorCode) {
    switch (errorCode) {
        case "auth/invalid-email":
            return "Formato de e-mail inválido.";
        case "auth/user-not-found":
            return "Nenhum usuário encontrado com este e-mail.";
        case "auth/wrong-password":
            return "Senha incorreta.";
        case "auth/email-already-in-use":
            return "Este e-mail já está em uso.";
        case "auth/weak-password":
            return "A senha deve ter pelo menos 6 caracteres.";
        default:
            return "Ocorreu um erro. Tente novamente.";
    }
}

async function handleAuth(isLogin = true, email, password) {
    const errorEl = document.getElementById('auth-error');
    const loginButton = document.querySelector('button[data-auth-type="login"]');
    const registerButton = document.querySelector('button[data-auth-type="register"]');

    loginButton.disabled = true;
    loginButton.textContent = isLogin ? 'Entrando...' : 'Entrar';
    registerButton.disabled = true;
    registerButton.textContent = !isLogin ? 'Registrando...' : 'Criar Conta';
    errorEl.textContent = "";

    try {
        if (isLogin) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        window.location.href = '/index.html';
    } catch (err) {
        errorEl.textContent = getFirebaseErrorMessage(err.code);
        console.error(err);
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Entrar';
        registerButton.disabled = false;
        registerButton.textContent = 'Criar Conta';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        const isLoginPage = window.location.pathname.endsWith('login.html');
        const isIndexPage = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');

        if (user) {
            if (isLoginPage) {
                window.location.href = '/index.html';
            }
        } else {
            if (!isLoginPage) {
                window.location.href = '/login.html';
            } else {
                renderLoginPage();
            }
        }
    });
});

function renderLoginPage() {
    const container = document.getElementById('login-container');
    if (!container) return;

    container.innerHTML = `
        <div class="background-effects">
            <div class="bg-shape1"></div>
            <div class="bg-shape2"></div>
        </div>
        <div class="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700 z-10 rounded-lg shadow-lg">
            <div class="text-center p-6">
                <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <span class="text-slate-900 font-bold text-4xl">G</span>
                </div>
                <h1 class="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Gênio IA</h1>
                <p class="text-slate-400">Acesse o seu centro de comando.</p>
            </div>
            <div class="p-6">
                <div id="tabs-container">
                    <div class="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-700 rounded-md">
                        <button id="login-tab" class="px-3 py-2 data-active">Entrar</button>
                        <button id="register-tab" class="px-3 py-2">Registrar</button>
                    </div>
                    <div id="login-form-content" class="space-y-4 pt-4">
                        </div>
                    <div id="register-form-content" class="space-y-4 pt-4 hidden">
                        </div>
                </div>
            </div>
        </div>
    `;
    
    renderForms();
    setupTabs();
}

function renderForms() {
    const loginContent = document.getElementById('login-form-content');
    const registerContent = document.getElementById('register-form-content');

    const formHTML = (type) => `
        <div class="space-y-2">
            <label for="${type}-email" class="text-slate-300">Email</label>
            <input id="${type}-email" type="email" placeholder="seu@email.com" class="w-full bg-slate-900/50 border-slate-600 text-slate-200 rounded p-2">
        </div>
        <div class="space-y-2">
            <label for="${type}-password" class="text-slate-300">Senha</label>
            <input id="${type}-password" type="password" placeholder="••••••••" class="w-full bg-slate-900/50 border-slate-600 text-slate-200 rounded p-2">
        </div>
        ${type === 'login' 
            ? `<button data-auth-type="login" class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded p-2">Entrar</button>`
            : `<button data-auth-type="register" class="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded p-2">Criar Conta</button>`
        }
    `;

    loginContent.innerHTML = formHTML('login');
    registerContent.innerHTML = formHTML('register');

    const errorEl = document.createElement('p');
    errorEl.id = 'auth-error';
    errorEl.className = 'text-red-400 text-sm text-center';
    loginContent.parentElement.insertBefore(errorEl, loginContent);


    document.querySelector('button[data-auth-type="login"]').addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        handleAuth(true, email, password);
    });

    document.querySelector('button[data-auth-type="register"]').addEventListener('click', () => {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        handleAuth(false, email, password);
    });
}

function setupTabs() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginContent = document.getElementById('login-form-content');
    const registerContent = document.getElementById('register-form-content');
    const errorEl = document.getElementById('auth-error');

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('data-active');
        registerTab.classList.remove('data-active');
        loginContent.classList.remove('hidden');
        registerContent.classList.add('hidden');
        errorEl.textContent = '';
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('data-active');
        loginTab.classList.remove('data-active');
        registerContent.classList.remove('hidden');
        loginContent.classList.add('hidden');
        errorEl.textContent = '';
    });
}

export async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = '/login.html';
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    }
}