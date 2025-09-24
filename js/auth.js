// Local: zainlet/dashboard-genio/ZainLet-DASHBOARD-GENIO-649c1ce7de1ce2fd13755098a68c4310cbe9ea3f/js/auth.js

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
        case "auth/invalid-credential":
             return "Credenciais inválidas. Verifique seu e-mail e senha.";
        default:
            return "Ocorreu um erro. Tente novamente.";
    }
}

async function handleAuth(isLogin = true, email, password) {
    const errorEl = document.getElementById('auth-error');
    if (!errorEl) return;
    const loginButton = document.querySelector('button[data-auth-type="login"]');
    const registerButton = document.querySelector('button[data-auth-type="register"]');

    if (!email || !password) {
        errorEl.textContent = "Por favor, preencha e-mail e senha.";
        return;
    }

    loginButton.disabled = true;
    loginButton.innerHTML = isLogin ? '<span class="animate-spin">..</span> Entrando...' : 'Entrar';
    registerButton.disabled = true;
    registerButton.innerHTML = !isLogin ? '<span class="animate-spin">..</span> Registrando...' : 'Criar Conta';
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
        console.error("Auth Error:", err);
    } finally {
        loginButton.disabled = false;
        loginButton.innerHTML = 'Entrar';
        registerButton.disabled = false;
        registerButton.innerHTML = 'Criar Conta';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        const isLoginPage = window.location.pathname.endsWith('login.html');
        
        if (user) {
            if (isLoginPage) {
                window.location.replace('/index.html');
            }
        } else {
            if (!isLoginPage) {
                window.location.replace('/login.html');
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
        <div class="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700 z-10 rounded-lg shadow-2xl">
            <div class="text-center p-6 border-b border-slate-700">
                <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <span class="text-slate-900 font-bold text-4xl">G</span>
                </div>
                <h1 class="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Gênio IA</h1>
                <p class="text-slate-400 mt-1">Acesse o seu centro de comando.</p>
            </div>
            <div class="p-6">
                <div id="tabs-container" class="space-y-4">
                    <div class="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-700 rounded-lg p-1">
                        <button id="login-tab" class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 data-active">Entrar</button>
                        <button id="register-tab" class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">Registrar</button>
                    </div>
                     <p id="auth-error" class="text-red-400 text-sm text-center h-5"></p>
                    <div id="login-form-content" class="space-y-4 pt-2">
                        </div>
                    <div id="register-form-content" class="space-y-4 pt-2 hidden">
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
    if (!loginContent || !registerContent) return;

    const formHTML = (type) => `
        <div class="space-y-2">
            <label for="${type}-email" class="text-sm font-medium text-slate-300">Email</label>
            <input id="${type}-email" type="email" autocomplete="email" required placeholder="seu@email.com" class="w-full bg-slate-900/50 border-slate-600 text-slate-200 rounded p-2 border focus:ring-emerald-500 focus:border-emerald-500 outline-none">
        </div>
        <div class="space-y-2">
            <label for="${type}-password" class="text-sm font-medium text-slate-300">Senha</label>
            <input id="${type}-password" type="password" autocomplete="${type === 'login' ? 'current-password' : 'new-password'}" required placeholder="••••••••" class="w-full bg-slate-900/50 border-slate-600 text-slate-200 rounded p-2 border focus:ring-emerald-500 focus:border-emerald-500 outline-none">
        </div>
        ${type === 'login' 
            ? `<button data-auth-type="login" class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white rounded p-2 font-semibold transition-opacity duration-200">Entrar</button>`
            : `<button data-auth-type="register" class="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:opacity-90 text-white rounded p-2 font-semibold transition-opacity duration-200">Criar Conta</button>`
        }
    `;

    loginContent.innerHTML = formHTML('login');
    registerContent.innerHTML = formHTML('register');

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
        if (errorEl) errorEl.textContent = '';
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('data-active');
        loginTab.classList.remove('data-active');
        registerContent.classList.remove('hidden');
        loginContent.classList.add('hidden');
        if (errorEl) errorEl.textContent = '';
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