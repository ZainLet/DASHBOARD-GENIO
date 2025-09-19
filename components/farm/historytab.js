import React, { useState } from "react";
import { FarmComment } from "@/entities/FarmComment";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, History, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const platformColors = {
  'instagram': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'tiktok': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'facebook': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

export default function HistoryTab({ comments, profiles, ads, loading, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Tem certeza que deseja excluir este comentário?")) {
      try {
        await FarmComment.delete(commentId);
        onRefresh();
      } catch (error) {
        console.error("Erro ao excluir comentário:", error);
      }
    }
  };

  const getProfileName = (perfilId) => {
    const profile = profiles.find(p => p.id === perfilId);
    return profile?.username || 'Perfil removido';
  };

  const getAdTitle = (anuncioId) => {
    const ad = ads.find(a => a.id === anuncioId);
    return ad?.titulo || 'Anúncio removido';
  };

  const filteredComments = comments.filter(comment =>
    Object.values(comment).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    getProfileName(comment.perfilId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getAdTitle(comment.anuncioId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-32 bg-slate-700" />
                  <Skeleton className="h-4 w-24 bg-slate-700" />
                  <Skeleton className="h-4 w-40 bg-slate-700" />
                  <Skeleton className="h-4 w-16 bg-slate-700" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar no histórico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
            
            <div className="text-sm text-slate-400">
              {filteredComments.length} comentários encontrados
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Perfil</TableHead>
                  <TableHead className="text-slate-300">Anúncio</TableHead>
                  <TableHead className="text-slate-300">Comentário</TableHead>
                  <TableHead className="text-slate-300">Plataforma</TableHead>
                  <TableHead className="text-slate-300">Data</TableHead>
                  <TableHead className="text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComments.map((comment) => (
                  <TableRow 
                    key={comment.id} 
                    className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {getProfileName(comment.perfilId)[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-200">
                          {getProfileName(comment.perfilId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 max-w-xs truncate">
                      {getAdTitle(comment.anuncioId)}
                    </TableCell>
                    <TableCell className="text-slate-300 max-w-md">
                      <div className="truncate" title={comment.texto}>
                        {comment.texto}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={platformColors[comment.plataforma] || platformColors.instagram}>
                        {comment.plataforma}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(comment.data).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="hover:bg-slate-700/50 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredComments.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum comentário encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}