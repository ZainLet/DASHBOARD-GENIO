import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../src/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redireciona se o usuário já estiver logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/"); // Navega para o dashboard se já houver uma sessão
      }
    });
    return () => unsubscribe();
  }, [navigate]);


  const handleAuth = async (isLogin = true) => {
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate("/"); // Navega para o dashboard após login/registro bem-sucedido
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
      console.error(err);
    }
    setLoading(false);
  };

  // Função para traduzir os erros mais comuns do Firebase
  const getFirebaseErrorMessage = (errorCode) => {
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
       {/* Background Effects */}
       <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border-slate-700 z-10">
        <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-slate-900 font-bold text-4xl">G</span>
            </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Gênio IA
          </CardTitle>
          <CardDescription className="text-slate-400">
            Acesse o seu centro de comando.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border-slate-700">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Registrar</TabsTrigger>
            </TabsList>

            {/* Aba de Login */}
            <TabsContent value="login" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-slate-300">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-slate-200"
                />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <Button onClick={() => handleAuth(true)} disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </TabsContent>

            {/* Aba de Registro */}
            <TabsContent value="register" className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-slate-300">Email</Label>
                    <Input
                        id="reg-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-900/50 border-slate-600 text-slate-200"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-slate-300">Senha</_Label>
                    <Input
                        id="reg-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-900/50 border-slate-600 text-slate-200"
                    />
                </div>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <Button onClick={() => handleAuth(false)} disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white">
                    {loading ? 'Registrando...' : 'Criar Conta'}
                </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}