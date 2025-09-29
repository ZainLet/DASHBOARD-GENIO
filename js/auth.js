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

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.innerHTML = isLogin ? '<span class="animate-spin">..</span> Entrando...' : 'Entrar';
    }
    if(registerButton){
        registerButton.disabled = true;
        registerButton.innerHTML = !isLogin ? '<span class="animate-spin">..</span> Registrando...' : 'Criar Conta';
    }
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
        if(loginButton) {
            loginButton.disabled = false;
            loginButton.innerHTML = 'Entrar';
        }
        if(registerButton) {
            registerButton.disabled = false;
            registerButton.innerHTML = 'Criar Conta';
        }
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
        <div class="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-8 animated scale-in">
            <div class="text-center mb-8">
                <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span class="text-gray-900 font-bold text-4xl">G</span>
                </div>
                <h1 class="text-3xl font-bold text-gray-100">Gênio IA</h1>
                <p class="text-gray-400 mt-1">Acesse o seu centro de comando.</p>
            </div>
            
            <div class="space-y-6">
                <div id="login-form-content" class="space-y-4">
                    </div>
                 <p id="auth-error" class="text-red-400 text-sm text-center h-5"></p>
            </div>
        </div>
    `;
    
    renderForms();
}

function renderForms() {
    const loginContent = document.getElementById('login-form-content');
    if (!loginContent) return;

    loginContent.innerHTML = `
        <div class="space-y-2">
            <label for="login-email" class="text-sm font-medium text-gray-300">Email</label>
            <input id="login-email" type="email" autocomplete="email" required placeholder="seu@email.com" class="w-full bg-gray-900 border-gray-600 text-gray-200 rounded p-3 border focus:ring-green-500 focus:border-green-500 outline-none">
        </div>
        <div class="space-y-2">
            <label for="login-password" class="text-sm font-medium text-gray-300">Senha</label>
            <input id="login-password" type="password" autocomplete="current-password" required placeholder="••••••••" class="w-full bg-gray-900 border-gray-600 text-gray-200 rounded p-3 border focus:ring-green-500 focus:border-green-500 outline-none">
        </div>
        <button data-auth-type="login" class="w-full bg-green-500 hover:opacity-90 text-white rounded p-3 font-semibold transition-opacity duration-200">Entrar</button>
    `;

    document.querySelector('button[data-auth-type="login"]').addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        handleAuth(true, email, password);
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