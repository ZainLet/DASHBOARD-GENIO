
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function InfluencerStats({ influencers, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
            <CardHeader>
              <Skeleton className="h-4 w-20 bg-slate-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-slate-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = {
    total: influencers.length,
    ativos: influencers.filter(inf => inf.status === 'ativo').length,
    conversoes: influencers.reduce((sum, inf) => sum + (inf.conversoes || 0), 0),
    investimento: influencers.reduce((sum, inf) => sum + (inf.valor || 0), 0)
  };

  const statCards = [
    {
      title: "Total",
      value: stats.total,
      icon: Users,
      color: "text-blue-400",
      gradient: "from-blue-500/20 to-cyan-500/20",
      border: "border-blue-500/30"
    },
    {
      title: "Ativos",
      value: stats.ativos,
      icon: TrendingUp,
      color: "text-emerald-400",
      gradient: "from-emerald-500/20 to-teal-500/20",
      border: "border-emerald-500/30"
    },
    {
      title: "Conversões",
      value: stats.conversoes,
      icon: Star,
      color: "text-purple-400",
      gradient: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-500/30"
    },
    {
      title: "Investimento",
      value: `R$ ${stats.investimento.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: "text-orange-400",
      gradient: "from-orange-500/20 to-red-500/20",
      border: "border-orange-500/30"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card 
          key={index}
          className={`bg-gradient-to-br ${stat.gradient} backdrop-blur-xl border ${stat.border} hover:scale-105 transition-transform duration-300`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
