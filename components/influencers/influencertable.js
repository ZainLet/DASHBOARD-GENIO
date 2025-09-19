
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ChevronUp, ChevronDown, ExternalLink, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  'prospeccao': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'nao-fechou': 'bg-red-500/20 text-red-400 border-red-500/30',
  'negociacao': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'ativo': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'pausado': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

const statusLabels = {
  'prospeccao': 'Prospecção',
  'nao-fechou': 'Não Fechou',
  'negociacao': 'Negociação',
  'ativo': 'Ativo',
  'pausado': 'Pausado'
};

export default function InfluencerTable({ 
  influencers, 
  loading, 
  onEdit, 
  onDelete, 
  sortColumn, 
  sortDirection, 
  onSort 
}) {
  const SortButton = ({ column, children }) => (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
    >
      {children}
      {sortColumn === column && (
        sortDirection === 'asc' ? 
          <ChevronUp className="w-4 h-4" /> : 
          <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  if (loading) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-32 bg-slate-700" />
                <Skeleton className="h-4 w-24 bg-slate-700" />
                <Skeleton className="h-4 w-20 bg-slate-700" />
                <Skeleton className="h-4 w-16 bg-slate-700" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">
                  <SortButton column="nome">Nome</SortButton>
                </TableHead>
                <TableHead className="text-slate-300">
                  <SortButton column="instagram">Instagram</SortButton>
                </TableHead>
                <TableHead className="text-slate-300">
                  <SortButton column="seguidoresIG">Seguidores</SortButton>
                </TableHead>
                <TableHead className="text-slate-300">
                  <SortButton column="status">Status</SortButton>
                </TableHead>
                <TableHead className="text-slate-300">
                  <SortButton column="valor">Valor</SortButton>
                </TableHead>
                <TableHead className="text-slate-300">
                  <SortButton column="nicho">Nicho</SortButton>
                </TableHead>
                <TableHead className="text-slate-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {influencers.map((influencer) => (
                <TableRow 
                  key={influencer.id} 
                  className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center text-slate-900 font-bold text-sm">
                        {influencer.nome?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-200">{influencer.nome}</div>
                        {influencer.premium && (
                          <Badge className="mt-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {influencer.instagram ? (
                      <a
                        href={`https://instagram.com/${influencer.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {influencer.instagram}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {influencer.seguidoresIG ? influencer.seguidoresIG.toLocaleString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[influencer.status] || statusColors.prospeccao}>
                      {statusLabels[influencer.status] || influencer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {influencer.valor ? `R$ ${influencer.valor.toLocaleString('pt-BR')}` : '-'}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {influencer.nicho || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(influencer)}
                        className="hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(influencer.id)}
                        className="hover:bg-slate-700/50 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {influencers.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum influenciador encontrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
