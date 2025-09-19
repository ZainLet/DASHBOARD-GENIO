import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Importe o Layout e todas as suas páginas
import Layout from "../layout";
import Login from "../pages/Login";
import Dashboard from "../pages/dashboard";
import Influencers from "../pages/influencers";
import Farm from "../pages/farm";
import CRM from "../pages/crm";
import Assistant from "../pages/assistant";

// Componente para proteger rotas
function ProtectedRoute({ children }) {
  // Se não houver lógica de autenticação aqui, o Layout cuidará do redirecionamento
  // Esta é uma camada extra de segurança
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública para o Login */}
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas que usam o Layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/influencers" 
          element={
            <ProtectedRoute>
              <Layout><Influencers /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/farm" 
          element={
            <ProtectedRoute>
              <Layout><Farm /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/crm" 
          element={
            <ProtectedRoute>
              <Layout><CRM /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/assistant" 
          element={
            <ProtectedRoute>
              <Layout><Assistant /></Layout>
            </ProtectedRoute>
          } 
        />

        {/* Rota para qualquer outro caminho não definido, redireciona para o dashboard */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}