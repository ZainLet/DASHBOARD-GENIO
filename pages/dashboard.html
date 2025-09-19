import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { 
  Users, 
  Bot, 
  Target, 
  ExternalLink,
  TrendingUp,
  Activity,
  Calendar,
  BarChart3,
  GitBranch
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const navigationCards = [
  {
    title: "Gestão de Influenciadores",
    description: "CRM completo para parcerias",
    icon: Users,
    url: createPageUrl("Influencers"),
    gradient: "from-emerald-500 to-teal-600",
    stats: "15 Ativos"
  },
  {
    title: "CRM Pipeline",
    description: "Follow-ups e negociações",
    icon: GitBranch,
    url: createPageUrl("CRM"),
    gradient: "from-indigo-500 to-purple-600",
    stats: "8 Em negociação"
  },
  {
    title: "Farm de Perfis",
    description: "Gestão de perfis para comentários",
    icon: Bot,
    url: createPageUrl("Farm"),
    gradient: "from-blue-500 to-cyan-600",
    stats: "8 Perfis"
  },
  {
    title: "Rotina & Metas",
    description: "Dashboard de produtividade",
    icon: Target,
    url: createPageUrl("Assistant"),
    gradient: "from-purple-500 to-pink-600",
    stats: "80% Hoje"
  },
  {
    title: "Ponto",
    description: "Sistema de ponto externo",
    icon: ExternalLink,
    url: "https://genioponto.netlify.app/",
    gradient: "from-orange-500 to-red-600",
    stats: "Externa",
    external: true
  }
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadUser();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Erro ao carregar usuário");
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-3">
                {getGreeting()}, {user?.full_name || 'Usuário'}!
              </h1>
              <p className="text-xl text-slate-300">
                Bem-vindo ao seu centro de comando
              </p>
            </div>
            
            <div className="flex flex-col items-end text-right">
              <div className="text-2xl font-bold text-slate-200">
                {currentTime.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="text-slate-400">
                {currentTime.toLocaleDateString('pt-BR', { 
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Influenciadores Ativos
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-200">15</div>
              <p className="text-xs text-slate-400">
                +2 desde ontem
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Comentários Hoje
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-200">127</div>
              <p className="text-xs text-slate-400">
                Meta: 150/dia
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Metas Concluídas
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-200">80%</div>
              <p className="text-xs text-slate-400">
                4 de 5 metas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Próximas Postagens
              </CardTitle>
              <Calendar className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-200">8</div>
              <p className="text-xs text-slate-400">
                Nos próximos 7 dias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {navigationCards.map((card, index) => (
            <Card 
              key={index}
              className="group relative overflow-hidden bg-slate-800/30 backdrop-blur-xl border-slate-700 hover:border-slate-600 transition-all duration-500 hover:scale-105 hover:shadow-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} shadow-lg`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {card.stats}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="relative z-10">
                <h3 className="text-xl font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">
                  {card.title}
                </h3>
                <p className="text-slate-400 text-sm mb-6 group-hover:text-slate-300 transition-colors">
                  {card.description}
                </p>

                {card.external ? (
                  <a 
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button 
                      className={`w-full bg-gradient-to-r ${card.gradient} hover:opacity-90 text-white font-semibold transition-all duration-300 hover:shadow-lg`}
                    >
                      Acessar <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                ) : (
                  <Link to={card.url} className="block w-full">
                    <Button 
                      className={`w-full bg-gradient-to-r ${card.gradient} hover:opacity-90 text-white font-semibold transition-all duration-300 hover:shadow-lg`}
                    >
                      Acessar
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Gênio IA © 2024 - Sistema de Gestão Inteligente
          </p>
        </div>
      </div>
    </div>
  );
}